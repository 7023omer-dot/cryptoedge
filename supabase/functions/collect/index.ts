// ============================================================
// CryptoEdge — Edge Function: collect
// אוסף מחירים כל 5 דקות ושומר ל-market_snapshots — רץ 24/7 בשרת,
// ללא תלות בדפדפן פתוח. מופעל ע"י Cron (pg_cron / scheduled).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYMBOLS = ["BTC", "ETH", "SOL", "SUI", "ALGO"];
const CG_IDS: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", sui: "SUI", algorand: "ALGO",
};

// timeout wrapper — לא נתקעים על API איטי
async function fetchJSON(url: string, ms = 8000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function getPrices(): Promise<Record<string, any>> {
  const cgUrl =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,sui,algorand&vs_currencies=usd&include_24hr_vol=true";
  try {
    const data = await fetchJSON(cgUrl);
    const out: Record<string, any> = {};
    for (const id of Object.keys(CG_IDS)) {
      if (data[id]) {
        out[CG_IDS[id]] = { price: data[id].usd ?? null, vol: data[id].usd_24h_vol ?? null };
      }
    }
    if (Object.keys(out).length) return out;
    throw new Error("empty CG");
  } catch (_e) {
    // fallback: CryptoCompare
    const cc = await fetchJSON(
      "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,SOL,SUI,ALGO&tsyms=USD",
    );
    const out: Record<string, any> = {};
    for (const sym of SYMBOLS) {
      const r = cc?.RAW?.[sym]?.USD;
      if (r) out[sym] = { price: r.PRICE ?? null, vol: r.VOLUME24HOURTO ?? null };
    }
    return out;
  }
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const prices = await getPrices();
    // ts מעוגל ל-5 דקות → idempotent, לא נוצרות כפילויות בהפעלה חוזרת
    const ts = new Date(Math.floor(Date.now() / 300000) * 300000).toISOString();

    const rows = SYMBOLS.filter((s) => prices[s]).map((s) => ({
      symbol: s,
      ts,
      open: prices[s].price,
      high: prices[s].price,
      low: prices[s].price,
      close: prices[s].price,
      volume: prices[s].vol,
      interval: "5m",
    }));

    if (!rows.length) {
      return new Response(JSON.stringify({ ok: false, error: "no prices" }), { status: 502 });
    }

    const { error } = await supabase
      .from("market_snapshots")
      .upsert(rows, { onConflict: "symbol,ts,interval" });

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, saved: rows.length, ts }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
