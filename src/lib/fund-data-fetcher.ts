import { HDFC_FUNDS, Fund } from '@/data/hdfc-funds';

interface NAVEntry {
  date: string;
  nav: string;
}

interface MFAPIResponse {
  meta: { scheme_code: number; scheme_name: string };
  data: NAVEntry[];
}

interface AMFINavEntry {
  schemeCode: number;
  nav: number;
  date: string;
}

/**
 * Fetch latest NAV for all mutual funds from AMFI's official daily file.
 * Returns a Map of schemeCode → { nav, date }
 */
export async function fetchAMFINavData(): Promise<Map<number, AMFINavEntry>> {
  const res = await fetch('https://www.amfiindia.com/spages/NAVAll.txt', {
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`AMFI fetch failed: ${res.status}`);

  const text = await res.text();
  const lines = text.split('\n');
  const navMap = new Map<number, AMFINavEntry>();

  for (const line of lines) {
    const parts = line.split(';');
    if (parts.length >= 6) {
      const schemeCode = parseInt(parts[0].trim(), 10);
      const nav = parseFloat(parts[4].trim());
      const date = parts[5].trim();

      if (!isNaN(schemeCode) && !isNaN(nav) && date) {
        navMap.set(schemeCode, { schemeCode, nav, date });
      }
    }
  }

  return navMap;
}

/**
 * Fetch historical NAV data from mfapi.in for a specific scheme.
 */
export async function fetchHistoricalNAV(schemeCode: number): Promise<NAVEntry[]> {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`mfapi.in fetch failed for ${schemeCode}: ${res.status}`);

  const data: MFAPIResponse = await res.json();
  return data.data || [];
}

/**
 * Calculate CAGR (Compound Annual Growth Rate).
 * Returns percentage (e.g., 15.5 for 15.5%)
 */
export function calculateCAGR(startNAV: number, endNAV: number, years: number): number {
  if (startNAV <= 0 || endNAV <= 0 || years <= 0) return 0;
  return (Math.pow(endNAV / startNAV, 1 / years) - 1) * 100;
}

/**
 * Find the NAV closest to a target date from a sorted (newest-first) NAV history.
 * Allows up to 5 business days tolerance for weekends/holidays.
 */
export function getHistoricalNAVOnDate(
  navHistory: NAVEntry[],
  targetDate: Date
): { nav: number; date: string } | null {
  const targetTime = targetDate.getTime();
  const tolerance = 5 * 24 * 60 * 60 * 1000; // 5 days

  let closest: NAVEntry | null = null;
  let closestDiff = Infinity;

  for (const entry of navHistory) {
    // AMFI/mfapi dates are in DD-MM-YYYY format
    const [dd, mm, yyyy] = entry.date.split('-');
    const entryDate = new Date(`${yyyy}-${mm}-${dd}`);
    const diff = Math.abs(entryDate.getTime() - targetTime);

    if (diff < closestDiff && diff <= tolerance) {
      closest = entry;
      closestDiff = diff;
    }

    // Since array is sorted newest-first, if we've gone past the target by more than tolerance, stop
    if (entryDate.getTime() < targetTime - tolerance) break;
  }

  if (!closest) return null;
  return { nav: parseFloat(closest.nav), date: closest.date };
}

/**
 * Calculate returns for a fund given its historical NAV data.
 */
function calculateReturns(
  navHistory: NAVEntry[],
  latestNAV: number,
  inceptionDate: string
): {
  return1y: number | null;
  return3y: number | null;
  return5y: number | null;
  return10y: number | null;
  returnSinceInception: number | null;
} {
  const now = new Date();

  const get = (yearsAgo: number): number | null => {
    const target = new Date(now);
    target.setFullYear(target.getFullYear() - yearsAgo);
    const entry = getHistoricalNAVOnDate(navHistory, target);
    if (!entry) return null;
    return parseFloat(calculateCAGR(entry.nav, latestNAV, yearsAgo).toFixed(2));
  };

  // Since inception
  let returnSinceInception: number | null = null;
  if (inceptionDate) {
    const inception = new Date(inceptionDate);
    const yearsFromInception = (now.getTime() - inception.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsFromInception >= 0.5) {
      const inceptionNAV = getHistoricalNAVOnDate(navHistory, inception);
      if (inceptionNAV) {
        returnSinceInception = parseFloat(
          calculateCAGR(inceptionNAV.nav, latestNAV, yearsFromInception).toFixed(2)
        );
      }
    }
  }

  return {
    return1y: get(1),
    return3y: get(3),
    return5y: get(5),
    return10y: get(10),
    returnSinceInception,
  };
}

/**
 * Refresh all fund data by fetching latest NAVs from AMFI and
 * historical NAVs from mfapi.in for return calculations.
 */
export async function refreshAllFunds(): Promise<{
  updatedFunds: Fund[];
  errors: string[];
  navDate: string;
}> {
  const errors: string[] = [];

  // Step 1: Fetch latest NAV from AMFI
  const amfiNavMap = await fetchAMFINavData();
  let navDate = '';

  // Step 2: Process each fund
  const updatedFunds: Fund[] = [];

  for (const fund of HDFC_FUNDS) {
    try {
      const amfiEntry = amfiNavMap.get(fund.amfiSchemeCode);
      if (!amfiEntry) {
        errors.push(`No AMFI NAV found for ${fund.name} (code: ${fund.amfiSchemeCode})`);
        updatedFunds.push(fund); // Keep static data
        continue;
      }

      if (!navDate) navDate = amfiEntry.date;

      // Step 3: Fetch historical NAV from mfapi.in
      const navHistory = await fetchHistoricalNAV(fund.amfiSchemeCode);

      if (navHistory.length === 0) {
        errors.push(`No historical NAV data for ${fund.name}`);
        updatedFunds.push({ ...fund, asOfDate: amfiEntry.date });
        continue;
      }

      // Step 4: Calculate returns
      const returns = calculateReturns(navHistory, amfiEntry.nav, fund.inceptionDate);

      updatedFunds.push({
        ...fund,
        return1y: returns.return1y,
        return3y: returns.return3y,
        return5y: returns.return5y,
        return10y: returns.return10y,
        returnSinceInception: returns.returnSinceInception,
        asOfDate: amfiEntry.date,
      });

      // Rate limit: 200ms between mfapi.in calls to be respectful
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      errors.push(`Error processing ${fund.name}: ${err instanceof Error ? err.message : String(err)}`);
      updatedFunds.push(fund); // Keep static data on error
    }
  }

  return { updatedFunds, errors, navDate };
}
