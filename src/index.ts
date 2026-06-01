interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Sveriges Riksbank (Sweden's central bank) SWEA v1 MCP. Keyless.
 *
 * Covers Swedish policy/key interest rates and SEK foreign-exchange rates.
 * Series are identified by string codes (e.g. SECBREPOEFF = policy rate,
 * SEKEURPMI = EUR/SEK, SEKUSDPMI = USD/SEK). All dates are YYYY-MM-DD.
 */


const BASE = 'https://api.riksbank.se/swea/v1';
const UA = 'pipeworx-mcp-riksbank-se/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'list_series',
    description:
      'Browse/search the Riksbank SWEA catalogue of time series (interest rates and SEK exchange rates). ' +
      'Returns series IDs plus descriptions and available date ranges. Optionally filter by a case-insensitive ' +
      'substring matched against the series ID and descriptions, e.g. "policy", "rate", "EUR", or "exchange". ' +
      'Series IDs are string codes; well-known ones: SECBREPOEFF (policy rate, formerly repo rate), ' +
      'SECBDEPOEFF (deposit rate), SECBLENDEFF (lending rate), SEKEURPMI (EUR/SEK fixing), SEKUSDPMI (USD/SEK fixing), ' +
      'SEKGBPPMI (GBP/SEK), SEKJPYPMI (JPY/SEK). Omit query to list all (~117 series).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Case-insensitive substring matched against series ID/descriptions, e.g. "EUR" or "policy".' },
        limit: { type: 'integer', description: 'Max results to return (default 50).' },
      },
    },
  },
  {
    name: 'get_observations',
    description:
      'Time-series observations for one series over a date range. Pass a series ID and a from/to window (dates YYYY-MM-DD). ' +
      'Returns an array of {date, value}. Example: seriesId "SEKEURPMI" gives the daily EUR/SEK exchange-rate fixing; ' +
      '"SECBREPOEFF" gives the Riksbank policy rate. Use list_series to discover IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        seriesId: { type: 'string', description: 'Series ID, e.g. "SEKEURPMI" (EUR/SEK) or "SECBREPOEFF" (policy rate).' },
        from: { type: 'string', description: 'Range start, YYYY-MM-DD, e.g. "2026-01-01".' },
        to: { type: 'string', description: 'Range end, YYYY-MM-DD, e.g. "2026-05-31".' },
      },
      required: ['seriesId', 'from', 'to'],
    },
  },
  {
    name: 'latest_observation',
    description:
      'Most recent observation for a single series, as {date, value}. ' +
      'Example: seriesId "SECBREPOEFF" returns the current Riksbank policy rate; "SEKUSDPMI" returns the latest USD/SEK fixing.',
    inputSchema: {
      type: 'object',
      properties: {
        seriesId: { type: 'string', description: 'Series ID, e.g. "SECBREPOEFF" (policy rate) or "SEKUSDPMI" (USD/SEK).' },
      },
      required: ['seriesId'],
    },
  },
  {
    name: 'cross_rates',
    description:
      'Cross exchange rate between two SEK currency-fixing series over a date range. ' +
      'series1 is the base, series2 the quote; the result is series1/series2 per day. ' +
      'Example: series1 "SEKEURPMI", series2 "SEKUSDPMI" gives EUR/USD derived from the SEK fixings. ' +
      'Provide from (required) and optionally to (both YYYY-MM-DD); omit to to run through the latest date. ' +
      'Use SEK currency series IDs ending in "PMI" (see list_series).',
    inputSchema: {
      type: 'object',
      properties: {
        series1: { type: 'string', description: 'Base currency series ID, e.g. "SEKEURPMI".' },
        series2: { type: 'string', description: 'Quote currency series ID, e.g. "SEKUSDPMI".' },
        from: { type: 'string', description: 'Range start, YYYY-MM-DD, e.g. "2026-01-01".' },
        to: { type: 'string', description: 'Range end, YYYY-MM-DD (optional; defaults to latest).' },
      },
      required: ['series1', 'series2', 'from'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'list_series': {
      const data = (await riksGet('/Series')) as Array<{
        seriesId: string;
        shortDescription?: string;
        longDescription?: string;
        observationMinDate?: string;
        observationMaxDate?: string;
        seriesClosed?: boolean;
      }>;
      const query = (args.query as string | undefined)?.toLowerCase().trim();
      const limit = typeof args.limit === 'number' && args.limit > 0 ? args.limit : 50;
      const all = (data ?? []).map((s) => ({
        seriesId: s.seriesId,
        shortDescription: s.shortDescription,
        longDescription: s.longDescription,
        observationMinDate: s.observationMinDate,
        observationMaxDate: s.observationMaxDate,
        seriesClosed: s.seriesClosed,
      }));
      const matched = query
        ? all.filter((s) =>
            `${s.seriesId} ${s.shortDescription ?? ''} ${s.longDescription ?? ''}`.toLowerCase().includes(query),
          )
        : all;
      return { count: Math.min(matched.length, limit), total: matched.length, results: matched.slice(0, limit) };
    }
    case 'get_observations': {
      const seriesId = reqStr(args, 'seriesId', '"SEKEURPMI"');
      const from = reqStr(args, 'from', '"2026-01-01"');
      const to = reqStr(args, 'to', '"2026-05-31"');
      return riksGet(`/Observations/${enc(seriesId)}/${enc(from)}/${enc(to)}`);
    }
    case 'latest_observation': {
      const seriesId = reqStr(args, 'seriesId', '"SECBREPOEFF"');
      return riksGet(`/Observations/Latest/${enc(seriesId)}`);
    }
    case 'cross_rates': {
      const series1 = reqStr(args, 'series1', '"SEKEURPMI"');
      const series2 = reqStr(args, 'series2', '"SEKUSDPMI"');
      const from = reqStr(args, 'from', '"2026-01-01"');
      const to = (args.to as string | undefined)?.trim();
      const path = `/CrossRates/${enc(series1)}/${enc(series2)}/${enc(from)}` + (to ? `/${enc(to)}` : '');
      return riksGet(path);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function riksGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Riksbank: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function enc(s: string): string {
  return encodeURIComponent(s.trim());
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
