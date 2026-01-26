import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { refreshAllFunds } from '@/lib/fund-data-fetcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret
  if (!cronSecret) return true;

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Refresh fund data from AMFI + mfapi.in
    const { updatedFunds, errors, navDate } = await refreshAllFunds();

    const supabase = getSupabase();

    // Upsert funds into Supabase
    let upsertedCount = 0;
    let performanceCount = 0;

    for (const fund of updatedFunds) {
      // Upsert fund record
      const { error: fundError } = await supabase.from('funds').upsert(
        {
          id: fund.id,
          name: fund.name,
          slug: fund.slug,
          category: fund.category,
          sub_category: fund.subCategory,
          risk_level: fund.riskLevel,
          aum_crores: fund.aumCrores,
          benchmark: fund.benchmark,
          expense_ratio: fund.expenseRatio,
          min_investment: fund.minInvestment,
          inception_date: fund.inceptionDate,
          fund_manager: fund.fundManager,
          investment_objective: fund.investmentObjective,
          suitable_for: fund.suitableFor,
          min_horizon_months: fund.minHorizonMonths,
          amfi_scheme_code: fund.amfiSchemeCode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (fundError) {
        errors.push(`Supabase upsert error for ${fund.name}: ${fundError.message}`);
      } else {
        upsertedCount++;
      }

      // Upsert performance record
      if (fund.asOfDate) {
        const { error: perfError } = await supabase.from('fund_performance').upsert(
          {
            fund_id: fund.id,
            return_1y: fund.return1y,
            return_3y: fund.return3y,
            return_5y: fund.return5y,
            return_10y: fund.return10y,
            return_since_inception: fund.returnSinceInception,
            as_of_date: fund.asOfDate.includes('-')
              ? fund.asOfDate
              : (() => {
                  // Convert DD-Mon-YYYY to YYYY-MM-DD
                  const d = new Date(fund.asOfDate);
                  return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
                })(),
          },
          { onConflict: 'fund_id,as_of_date' }
        );

        if (perfError) {
          errors.push(`Performance upsert error for ${fund.name}: ${perfError.message}`);
        } else {
          performanceCount++;
        }
      }
    }

    // Update metadata
    const duration = Date.now() - startTime;
    await supabase.from('data_metadata').upsert(
      {
        key: 'fund_data',
        last_updated: new Date().toISOString(),
        status: errors.length === 0 ? 'success' : 'partial',
        details: {
          fundsUpdated: upsertedCount,
          performanceRecords: performanceCount,
          errors: errors.slice(0, 10),
          navDate,
          durationMs: duration,
        },
      },
      { onConflict: 'key' }
    );

    return NextResponse.json({
      success: true,
      fundsUpdated: upsertedCount,
      performanceRecords: performanceCount,
      errors: errors.slice(0, 10),
      navDate,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Update metadata with failure
    try {
      await getSupabase().from('data_metadata').upsert(
        {
          key: 'fund_data',
          last_updated: new Date().toISOString(),
          status: 'error',
          details: {
            error: error instanceof Error ? error.message : String(error),
            durationMs: duration,
          },
        },
        { onConflict: 'key' }
      );
    } catch {
      // Ignore metadata update failure
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}
