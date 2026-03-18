---
name: google-search-console-cli
description: >
  Google Search Console data analysis and site management via google-search-console-cli.
  Use when the user wants to check search performance, analyze queries, inspect URL index status,
  manage sitemaps, or view site properties.
  Triggers: "Search Console", "search performance", "search queries", "GSC", "index status",
  "URL inspection", "sitemap", "search analytics", "impressions", "CTR", "search appearance".
---

# Google Search Console CLI Skill

You have access to `google-search-console-cli`, a CLI for the Google Search Console API. Use it to query search analytics, inspect URL indexing, and manage sites and sitemaps.

## Quick start

```bash
# Check if the CLI is available
google-search-console-cli --help

# List accessible sites
google-search-console-cli sites
```

If the CLI is not installed, install it:

```bash
npm install -g google-search-console-cli
```

## Authentication

The CLI uses a Google service account. Credentials are resolved in this order:

1. `--credentials <path>` flag (per-command)
2. `GOOGLE_APPLICATION_CREDENTIALS` env var
3. `~/.config/google-search-console-cli/credentials.json` (auto-detected)
4. gcloud Application Default Credentials

Before running any command, verify credentials are configured by running `google-search-console-cli sites`. If it fails with a credentials error, ask the user to set up authentication.

## Site URL formats

Search Console uses two property types:

- **URL-prefix property**: `https://www.example.com/` (must include trailing slash and protocol)
- **Domain property**: `sc-domain:example.com` (covers all protocols and subdomains)

Always use the exact format as registered in Search Console. The site URL is a positional argument for most commands.

## Output format

All commands output pretty-printed JSON by default. Use `--format compact` for single-line JSON (useful for piping).

## Commands

### Search analytics query

The `query` command is the primary tool for search performance data.

```bash
google-search-console-cli query <siteUrl> --start-date <date> --end-date <date> [options]
```

**Required:**
- `--start-date <date>` -- Start date (YYYY-MM-DD)
- `--end-date <date>` -- End date (YYYY-MM-DD)

**Optional:**
- `--dimensions <names>` -- Comma-separated: `date`, `query`, `page`, `country`, `device`, `searchAppearance`, `hour`
- `--type <type>` -- Search type: `web` (default), `image`, `video`, `news`, `discover`, `googleNews`
- `--dimension-filter <json>` -- JSON array of dimension filter groups (see below)
- `--aggregation-type <type>` -- `auto`, `byPage`, `byProperty`, `byNewsShowcasePanel`
- `--row-limit <n>` -- Max rows, 1-25000 (default 1000)
- `--start-row <n>` -- Starting row offset (default 0)
- `--data-state <state>` -- Data freshness: `all`, `final`, `hourly_all`

**Response fields per row:**
- `keys` -- Array of dimension values (in the order specified by `--dimensions`)
- `clicks` -- Number of clicks
- `impressions` -- Number of impressions
- `ctr` -- Click-through rate (0.0 to 1.0)
- `position` -- Average position in search results

### Sites management

```bash
# List all sites
google-search-console-cli sites

# Get info about a specific site
google-search-console-cli site <siteUrl>

# Add a site (requires Full permission)
google-search-console-cli site-add <siteUrl>

# Remove a site (requires Full permission)
google-search-console-cli site-remove <siteUrl>
```

### Sitemaps management

```bash
# List sitemaps for a site
google-search-console-cli sitemaps <siteUrl>

# List sitemaps under a specific sitemap index
google-search-console-cli sitemaps <siteUrl> --sitemap-index <url>

# Get info about a specific sitemap
google-search-console-cli sitemap <siteUrl> <feedpath>

# Submit a sitemap (requires Full permission)
google-search-console-cli sitemap-submit <siteUrl> <feedpath>

# Delete a sitemap (requires Full permission)
google-search-console-cli sitemap-delete <siteUrl> <feedpath>
```

### URL inspection

```bash
# Inspect a URL's index status
google-search-console-cli inspect <siteUrl> <inspectionUrl>

# With a specific language for messages
google-search-console-cli inspect <siteUrl> <inspectionUrl> --language zh-CN
```

The `--language` option controls the language of the messages in the response (default: `en-US`).

The response includes: index status (indexing state, crawl time, robots.txt status, canonical URL), AMP analysis (if applicable), mobile usability, and rich results detection.

## Dimension filter groups

The `--dimension-filter` option takes a JSON array of filter groups. Each filter group contains:

- `groupType` -- `"and"` (all filters must match)
- `filters` -- Array of filter objects

Each filter object:
- `dimension` -- One of: `query`, `page`, `country`, `device`, `searchAppearance`
- `operator` -- One of: `equals`, `notEquals`, `contains`, `notContains`, `includingRegex`, `excludingRegex`
- `expression` -- The value to match against

**Country codes** use 3-letter ISO 3166-1 alpha-3 format (e.g., `USA`, `GBR`, `DEU`, `JPN`).

**Device values**: `DESKTOP`, `MOBILE`, `TABLET`.

### Filter examples

Single filter:
```json
[{"groupType":"and","filters":[{"dimension":"country","operator":"equals","expression":"USA"}]}]
```

Multiple filters (AND):
```json
[{"groupType":"and","filters":[{"dimension":"country","operator":"equals","expression":"USA"},{"dimension":"device","operator":"equals","expression":"MOBILE"}]}]
```

Regex filter:
```json
[{"groupType":"and","filters":[{"dimension":"query","operator":"includingRegex","expression":"buy|purchase|order"}]}]
```

Page filter:
```json
[{"groupType":"and","filters":[{"dimension":"page","operator":"contains","expression":"/blog/"}]}]
```

## Practical examples

### Top search queries

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --row-limit 50
```

### Daily performance trend

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions date
```

### Top pages by clicks

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions page \
  --row-limit 50
```

### Performance by country

```bash
google-search-console-cli query sc-domain:example.com \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions country
```

### Performance by device

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions device
```

### Query performance for a specific page

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --dimension-filter '[{"groupType":"and","filters":[{"dimension":"page","operator":"equals","expression":"https://www.example.com/product"}]}]'
```

### Mobile performance in a specific country

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --dimension-filter '[{"groupType":"and","filters":[{"dimension":"country","operator":"equals","expression":"USA"},{"dimension":"device","operator":"equals","expression":"MOBILE"}]}]'
```

### Brand vs non-brand queries

```bash
# Brand queries
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --dimension-filter '[{"groupType":"and","filters":[{"dimension":"query","operator":"includingRegex","expression":"example|exmpl"}]}]'

# Non-brand queries
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --dimension-filter '[{"groupType":"and","filters":[{"dimension":"query","operator":"excludingRegex","expression":"example|exmpl"}]}]'
```

### Blog section performance

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions page \
  --dimension-filter '[{"groupType":"and","filters":[{"dimension":"page","operator":"contains","expression":"/blog/"}]}]'
```

### Image search performance

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --type image \
  --row-limit 50
```

### Which pages rank for a specific query (cannibalization check)

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions page \
  --dimension-filter '[{"groupType":"and","filters":[{"dimension":"query","operator":"equals","expression":"best running shoes"}]}]'
```

### Cross-dimension analysis (query x page)

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query,page \
  --row-limit 100
```

### Device trend over time

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions date,device
```

### Google News performance

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions page \
  --type googleNews
```

### Discover feed performance

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions page \
  --type discover
```

### Hourly performance trend (with fresh data)

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-03-17 \
  --end-date 2026-03-17 \
  --dimensions hour \
  --data-state hourly_all
```

### Per-page aggregation (deduplicate by page)

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions page \
  --aggregation-type byPage
```

### Paginate through large result sets

```bash
# First 1000 rows
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --row-limit 1000

# Next 1000 rows
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --row-limit 1000 \
  --start-row 1000
```

### Search appearance breakdown

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions searchAppearance
```

### Inspect a URL's index status

```bash
google-search-console-cli inspect https://www.example.com/ https://www.example.com/important-page
```

### Audit sitemaps

```bash
# List all sitemaps
google-search-console-cli sitemaps https://www.example.com/

# Check a specific sitemap
google-search-console-cli sitemap https://www.example.com/ https://www.example.com/sitemap.xml
```

## Workflow guidance

### When the user asks for a search performance overview

1. Run `google-search-console-cli sites` to find accessible sites
2. Run a `query` with `--dimensions date` for the daily trend
3. Run a `query` with `--dimensions query` for top queries
4. Present key metrics: total clicks, impressions, average CTR, average position

### When the user asks about a specific page's SEO

1. Use `query` with `--dimensions query` and a `--dimension-filter` for the page URL
2. Use `inspect` to check the page's index status
3. Cross-reference query rankings (position) with indexing health

### When the user asks about mobile vs desktop performance

1. Run `query` with `--dimensions device` for the overview
2. Optionally drill down with `--dimensions query,device` to find queries that perform differently across devices

### When the user asks about international performance

1. Run `query` with `--dimensions country` for country breakdown
2. Drill down with `--dimension-filter` for specific countries

### When the user asks about indexing issues

1. Use `inspect` for specific URLs
2. Check sitemaps with `sitemaps` and `sitemap` commands
3. Look at the inspection response for crawl errors, indexing blocks, or mobile usability issues

## Permission levels

- **Read-only (Restricted)**: `sites`, `site`, `query`, `sitemaps`, `sitemap`, `inspect`
- **Write (Full)**: `site-add`, `site-remove`, `sitemap-submit`, `sitemap-delete`

Most analysis workflows only need read-only permission.

## Error handling

- **Authentication errors** -- ask the user to verify their service account credentials
- **403 Permission denied** -- the service account lacks access to the site; it must be added per-site in Search Console settings
- **Empty results** -- check date range (data is typically available 2-3 days after the date), verify the site URL format matches the registered property
- **400 Bad request** -- check dimension filter JSON syntax and field compatibility

## API documentation references

| Reference | When to Use |
|-----------|-------------|
| [google-search-console-cli documentation](https://github.com/Bin-Huang/google-search-console-cli) | Full README, setup guide, installation |
| [Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) | Query method, dimensions, filters, response format |
| [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect) | Inspect method, request/response fields |
| [Sites API](https://developers.google.com/webmaster-tools/v1/sites) | Site management methods and permission levels |
| [Sitemaps API](https://developers.google.com/webmaster-tools/v1/sitemaps) | Sitemap management methods and resource fields |
