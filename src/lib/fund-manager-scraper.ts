import { type Fund } from '@/data/hdfc-funds';

const BASE_URL = 'https://www.hdfcfund.com/explore/mutual-funds';

// Slugs that differ from our static data slug field
const SLUG_OVERRIDES: Record<string, string> = {
  'hdfc-retirement-savings-fund-equity': 'hdfc-retirement-savings-fund-equity-plan',
  'hdfc-retirement-savings-fund-hybrid-equity': 'hdfc-retirement-savings-fund-hybrid-equity-plan',
  'hdfc-retirement-savings-fund-hybrid-debt': 'hdfc-retirement-savings-fund-hybrid-debt-plan',
  'hdfc-silver-etf-fund-of-fund': 'hdfc-silver-etf-fund-fund',
  'hdfc-capital-builder-value-fund': 'hdfc-value-fund',
  'hdfc-elss-tax-saver-fund': 'hdfc-elss-tax-saver',
  'hdfc-pharma-healthcare-fund': 'hdfc-pharma-and-healthcare-fund',
  'hdfc-banking-financial-services-fund': 'hdfc-banking-and-financial-services-fund',
  'hdfc-banking-psu-debt-fund': 'hdfc-banking-and-psu-debt-fund',
};

// Funds that consistently 404 on hdfcfund.com — skip to save time
const SKIP_SLUGS = new Set([
  'hdfc-gold-etf-fund-of-fund',
  'hdfc-childrens-gift-fund',
]);

interface ManagerEntry {
  managerName: string;
  since: string;
  desgination: string;
  managerID: string;
}

export interface ScrapeResult {
  managers: Map<string, string>;
  errors: string[];
  scraped: number;
}

function cleanManagerName(name: string): string {
  return name.replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, '').trim();
}

function extractPrimaryManager(html: string): string | null {
  const startMarker = '<script id="__NEXT_DATA__" type="application/json">';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;

  const jsonStart = startIdx + startMarker.length;
  const endIdx = html.indexOf('</script>', jsonStart);
  if (endIdx === -1) return null;

  try {
    const jsonStr = html.substring(jsonStart, endIdx);
    const nextData = JSON.parse(jsonStr);

    const details =
      nextData?.props?.pageProps?.singleFundResponse?.data?.details;
    if (!Array.isArray(details)) return null;

    for (const detail of details) {
      if (detail.managers && Array.isArray(detail.managers)) {
        const primaryManagers = (detail.managers as ManagerEntry[])
          .map((m) => cleanManagerName(m.managerName))
          .filter(Boolean);

        if (primaryManagers.length > 0) {
          return primaryManagers[0];
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function scrapeFundManagers(
  funds: Fund[]
): Promise<ScrapeResult> {
  const managers = new Map<string, string>();
  const errors: string[] = [];
  let scraped = 0;

  for (const fund of funds) {
    const slug = SLUG_OVERRIDES[fund.slug] || fund.slug;

    if (SKIP_SLUGS.has(slug)) continue;

    try {
      const url = `${BASE_URL}/${slug}/direct`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'MutualFundDost/1.0' },
      });

      if (!res.ok) {
        if (res.status === 404) {
          errors.push(`404: ${fund.id} (slug: ${slug})`);
        } else {
          errors.push(`HTTP ${res.status}: ${fund.id}`);
        }
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const html = await res.text();
      const manager = extractPrimaryManager(html);

      if (manager) {
        managers.set(fund.id, manager);
        scraped++;
      } else {
        errors.push(`No manager found: ${fund.id}`);
      }
    } catch (err) {
      errors.push(
        `Error: ${fund.id} — ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Rate limit: 500ms between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  return { managers, errors, scraped };
}
