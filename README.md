# mcp-riksbank-se

Sveriges Riksbank (Sweden's central bank) SWEA v1 MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_series` | Browse/search the Riksbank SWEA catalogue of time series (interest rates and SEK exchange rates). Returns series IDs plus descriptions and available date ranges. Optionally filter by a case-insensitive substring matched against the series ID and descriptions, e.g. "policy", "rate", "EUR", or "exchange". Series IDs are string codes; well-known ones: SECBREPOEFF (policy rate, formerly repo rate), SECBDEPOEFF (deposit rate), SECBLENDEFF (lending rate), SEKEURPMI (EUR/SEK fixing), SEKUSDPMI (USD/SEK fixing), SEKGBPPMI (GBP/SEK), SEKJPYPMI (JPY/SEK). Omit query to list all (~117 series). |
| `get_observations` | Time-series observations for one series over a date range. Pass a series ID and a from/to window (dates YYYY-MM-DD). Returns an array of {date, value}. Example: seriesId "SEKEURPMI" gives the daily EUR/SEK exchange-rate fixing; "SECBREPOEFF" gives the Riksbank policy rate. Use list_series to discover IDs. |
| `latest_observation` | Most recent observation for a single series, as {date, value}. Example: seriesId "SECBREPOEFF" returns the current Riksbank policy rate; "SEKUSDPMI" returns the latest USD/SEK fixing. |
| `cross_rates` | Cross exchange rate between two SEK currency-fixing series over a date range. series1 is the base, series2 the quote; the result is series1/series2 per day. Example: series1 "SEKEURPMI", series2 "SEKUSDPMI" gives EUR/USD derived from the SEK fixings. Provide from (required) and optionally to (both YYYY-MM-DD); omit to to run through the latest date. Use SEK currency series IDs ending in "PMI" (see list_series). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "riksbank-se": {
      "url": "https://gateway.pipeworx.io/riksbank-se/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/riksbank-se/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Riksbank Se data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/riksbank_se_list_series \
  -H 'Content-Type: application/json' \
  -d '{"query":"policy"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/riksbank_se_list_series`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
