# mcp-riksbank-se

Sveriges Riksbank (Sweden's central bank) SWEA v1 MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Riksbank Se data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
