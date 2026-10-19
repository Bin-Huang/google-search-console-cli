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

## Setup

Before running any command, run `google-search-console-cli sites` to check the credentials. If it fails or prints `[]`, guide the user through these steps. Full guide: https://github.com/Bin-Huang/google-search-console-cli#setup

1. **Enable the API.** In a Google Cloud project, enable the Search Console API: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
2. **Create a service account and download a JSON key** (IAM & Admin > Service Accounts > Keys > Add Key > JSON). If key creation is blocked, the organization enforces `constraints/iam.managed.disableServiceAccountKeyCreation` (on by default for organizations created on or after May 3, 2024). An organization admin can override it for the project, or the user can use Application Default Credentials (below).
3. **Place the key file.** The CLI uses the first one it finds:
   1. `--credentials <path>` flag
   2. `GOOGLE_APPLICATION_CREDENTIALS` env var
   3. `~/.config/google-search-console-cli/credentials.json`
   4. gcloud Application Default Credentials
4. **Grant access in Search Console.** A property **Owner** opens Settings > Users and permissions > Add user, enters the key file's `client_email`, and chooses **Full** or **Restricted** (not Owner). Repeat for each property.
5. **Verify.** Run `google-search-console-cli sites`. `[]` means the access from step 4 is not active yet. The CLI also writes a JSON `warning` to stderr.

**Alternative: Application Default Credentials** (sign in with the user's own Google account). The user installs gcloud, configures the OAuth consent screen, adds their own account as a test user (External audience), and creates a **Desktop app** OAuth client. Then:

```bash
gcloud auth application-default login \
  --client-id-file=/path/to/client_secret.json \
  --scopes="https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform"
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

The CLI uses these credentials only when no key file is found. While the OAuth app uses the External audience and is in **Testing** status, the user must run the login command again every 7 days.

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
- `--all` -- Fetch all rows with auto-pagination (mutually exclusive with `--start-row`)

**Response fields per row:**
- `keys` -- Array of dimension values (in the order specified by `--dimensions`)
- `clicks` -- Number of clicks
- `impressions` -- Number of impressions
- `ctr` -- Click-through rate (0.0 to 1.0)
- `position` -- Average position in search results

#### Auto-pagination with --all

When `--all` is specified, the CLI automatically paginates through all results (using 25000 rows per page) and returns the complete dataset. This is useful for exporting all data without manual pagination.

```bash
# Get ALL queries (auto-paginates through all pages)
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --all
```

Note: `--all` and `--start-row` cannot be used together. When `--all` is used, `--row-limit` is ignored.

### Sites management

```bash
# List all sites
google-search-console-cli sites

# Get info about a specific site
google-search-console-cli site <siteUrl>

# Add a site (requires Full permission; the site stays unverified)
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
# Inspect a single URL's index status
google-search-console-cli inspect <siteUrl> <inspectionUrl>

# With a specific language for messages
google-search-console-cli inspect <siteUrl> <inspectionUrl> --language zh-CN
```

The `--language` option controls the language of the messages in the response (default: `en-US`).

The response includes: index status (indexing state, crawl time, robots.txt status, canonical URL), AMP analysis (if applicable), mobile usability, and rich results detection.

### Batch URL inspection

Inspect multiple URLs in a single command:

```bash
# From a file (one URL per line)
google-search-console-cli inspect-batch https://www.example.com/ --file urls.txt

# From stdin
cat urls.txt | google-search-console-cli inspect-batch https://www.example.com/

# With compact format (NDJSON, streams results as they complete)
cat urls.txt | google-search-console-cli inspect-batch https://www.example.com/ --format compact
```

Options:
- `--file <path>` -- File with URLs (one per line); reads stdin if omitted
- `--language <code>` -- Language code for messages (default: `en-US`)

Progress is written to stderr: `Inspecting 1/50: https://...`

With `--format compact`, each result is streamed as NDJSON (one JSON object per line) as soon as it completes. With `--format json` (default), all results are collected and output as a JSON array at the end.

Per-URL errors are captured in the output (with an `error` field and, when available, a `code` field such as `403` or `429`) without stopping the batch. If any URL could not be inspected (an API or request error, not a `FAIL` verdict), the command still prints all results, then writes `{"error": "N of M URLs could not be inspected."}` to stderr and exits with code 1. Check the per-URL `error` fields to see which URLs failed.

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

### Fetch all rows (auto-pagination)

```bash
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 \
  --end-date 2026-03-17 \
  --dimensions query \
  --all
```

### Paginate through large result sets (manual)

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

### Batch inspect multiple URLs

```bash
# Create a file with URLs to inspect
echo "https://www.example.com/page1
https://www.example.com/page2
https://www.example.com/page3" > urls.txt

# Batch inspect
google-search-console-cli inspect-batch https://www.example.com/ --file urls.txt

# Or pipe from another command
google-search-console-cli query https://www.example.com/ \
  --start-date 2026-02-16 --end-date 2026-03-17 \
  --dimensions page --format compact \
  | jq -r '.rows[].keys[0]' \
  | google-search-console-cli inspect-batch https://www.example.com/ --format compact
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

1. Use `inspect` for specific URLs, or `inspect-batch` for bulk checking
2. Check sitemaps with `sitemaps` and `sitemap` commands
3. Look at the inspection response for crawl errors, indexing blocks, or mobile usability issues

### When the user wants to export all search data

1. Use `query` with `--all` to auto-paginate through all results
2. Use `--format compact` for NDJSON output suitable for piping to `jq` or other tools

## Permission levels

- **Read-only (Restricted)**: `sites`, `site`, `query`, `sitemaps`, `sitemap`, `inspect`, `inspect-batch`
- **Write (Full)**: `site-add`, `site-remove`, `sitemap-submit`, `sitemap-delete`

`site-add` adds the site to the account in an unverified state. It does not give access to the site's data.

Most analysis workflows only need read-only permission.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Search Console shows "Email not found" for the correct `client_email` | Known Google-side delay for new service accounts: several hours to several weeks (https://discuss.google.dev/t/problem-with-new-service-accounts/362176). The CLI cannot fix it. | Try again later, or switch to Application Default Credentials. First check that the user entered `client_email` (ends in `.iam.gserviceaccount.com`), not `client_id`. |
| `sites` prints `[]` (stderr has a `warning`) | The credentials work, but have no access to any property yet. | Do setup step 4 for each property, with the same `client_email` as in the key file. |
| `No credentials found` | No key file and no Application Default Credentials. | Do setup step 3. |
| `is an OAuth client file, not a service account key` | The file has an `installed` or `web` field. | Download a service account key, or use the file with `gcloud --client-id-file`. |
| 403 with `SERVICE_DISABLED` or "has not been used in project" | The Search Console API is not enabled in the project of the credentials (or the quota project for Application Default Credentials). | Enable the API (setup step 1), wait a few minutes, retry. |
| 403 "User does not have sufficient permission for site". With `inspect`: 403 "You do not own this site, ...". With `site`: 404 "is not a verified Search Console site in this account" | No access to this property, or **Restricted** access for a write command. | Add the account to the property with the right level. Check that the site URL matches the property exactly. |
| "This app is blocked" during gcloud login | gcloud's own OAuth client cannot request the Search Console scope. | Add `--client-id-file` with the user's own OAuth client. |
| Application Default Credentials fail after 7 days (`invalid_grant`) | OAuth app with the External audience in **Testing** status. | Run the gcloud login command again. |
| Service account key fails with `invalid_grant: ...` (e.g. `account not found`) | The key or the service account was deleted or disabled. | Create a new key and replace the key file. A new service account also needs setup step 4 again. |
| Empty `query` results | Data is usually available 2-3 days after the date, or the site URL format does not match the property. | Move the date range back, and use the exact property URL. |
| 400 Bad request | Invalid dimension filter JSON or incompatible fields. | Check the `--dimension-filter` syntax and field compatibility. |

## API documentation references

| Reference | When to Use |
|-----------|-------------|
| [google-search-console-cli documentation](https://github.com/Bin-Huang/google-search-console-cli) | Full README, setup guide, installation |
| [Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) | Query method, dimensions, filters, response format |
| [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect) | Inspect method, request/response fields |
| [Sites API](https://developers.google.com/webmaster-tools/v1/sites) | Site management methods and permission levels |
| [Sitemaps API](https://developers.google.com/webmaster-tools/v1/sitemaps) | Sitemap management methods and resource fields |
