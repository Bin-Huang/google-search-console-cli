# google-search-console-cli

A Google Search Console CLI designed for AI agents. Wraps the official Search Console API with simple, agent-friendly commands.

**Works with:** OpenClaw, Claude Code, Cursor, Codex, and any agent that can run shell commands.

## Installation

```bash
npm install -g google-search-console-cli
```

Or run directly with npx:

```bash
npx google-search-console-cli --help
```

For development:

```bash
pnpm install
pnpm build
```

## How it works

This CLI is a thin wrapper around Google's official APIs:

- **[Search Console API v1](https://developers.google.com/webmaster-tools/v1/api_reference_index)** — URL inspection (`inspect`)
- **[Webmasters API v3](https://developers.google.com/webmaster-tools/v1/api_reference_index)** — search analytics, sites, and sitemaps (`query`, `sites`, `sitemaps`)

Under the hood it uses the official Node.js client library [`googleapis`](https://www.npmjs.com/package/googleapis). All API responses are passed through as JSON.

## Authentication

Credentials are resolved in this order:

1. **`--credentials <path>` flag** — pass a service account JSON key file directly
2. **`GOOGLE_APPLICATION_CREDENTIALS` env var** — standard [ADC](https://cloud.google.com/docs/authentication/application-default-credentials) environment variable
3. **`~/.config/google-search-console-cli/credentials.json`** — default credentials file (auto-detected if present)
4. **gcloud ADC** — falls back to `~/.config/gcloud/application_default_credentials.json`

### Service Account setup (recommended for automation)

1. In the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts), create a Service Account in a project with the **Search Console API** enabled.
2. Create a JSON key for the Service Account and download it.
3. Place the key file in one of the locations above:

```bash
# Option: use the default path
mkdir -p ~/.config/google-search-console-cli
cp service-account-key.json ~/.config/google-search-console-cli/credentials.json

# Option: set the env var
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Option: pass per-invocation
google-search-console-cli sites --credentials /path/to/service-account-key.json
```

4. In [Search Console](https://search.google.com/search-console) → Settings → Users and permissions, add the Service Account email (e.g. `name@project.iam.gserviceaccount.com`) as a user.

### gcloud ADC (for local development)

```bash
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/webmasters.readonly"
```

## Usage

All commands output pretty-printed JSON by default. Use `--format compact` for compact single-line JSON.

Site URLs follow the Search Console format: `https://www.example.com/` for URL-prefix properties, or `sc-domain:example.com` for Domain properties.

### query

Query search analytics data with filters and dimensions.

```bash
# Basic query: top queries for the last 30 days
google-search-console-cli query https://www.example.com/ \
  --start-date 2025-01-01 \
  --end-date 2025-01-31 \
  --dimensions query

# Top pages by country
google-search-console-cli query sc-domain:example.com \
  --start-date 2025-01-01 \
  --end-date 2025-01-31 \
  --dimensions page,country \
  --row-limit 100

# With dimension filters
google-search-console-cli query https://www.example.com/ \
  --start-date 2025-01-01 \
  --end-date 2025-01-31 \
  --dimensions query \
  --dimension-filter '[{"groupType":"and","filters":[{"dimension":"country","operator":"equals","expression":"USA"}]}]'

# Image search results
google-search-console-cli query https://www.example.com/ \
  --start-date 2025-01-01 \
  --end-date 2025-01-31 \
  --dimensions query \
  --type image

# Include fresh (unfinalized) data
google-search-console-cli query https://www.example.com/ \
  --start-date 2025-01-01 \
  --end-date 2025-01-31 \
  --dimensions date \
  --data-state all
```

Available dimensions: `date`, `query`, `page`, `country`, `device`, `searchAppearance`

Available types: `web` (default), `image`, `video`, `news`, `discover`, `googleNews`

### sites

List all sites in your Search Console account.

```bash
google-search-console-cli sites
```

### site

Get information about a specific site.

```bash
google-search-console-cli site https://www.example.com/
google-search-console-cli site sc-domain:example.com
```

### site-add

Add a site to Search Console.

```bash
google-search-console-cli site-add https://www.example.com/
```

### site-remove

Remove a site from Search Console.

```bash
google-search-console-cli site-remove https://www.example.com/
```

### sitemaps

List sitemaps for a site.

```bash
google-search-console-cli sitemaps https://www.example.com/
```

### sitemap

Get information about a specific sitemap.

```bash
google-search-console-cli sitemap https://www.example.com/ https://www.example.com/sitemap.xml
```

### sitemap-submit

Submit a sitemap for a site.

```bash
google-search-console-cli sitemap-submit https://www.example.com/ https://www.example.com/sitemap.xml
```

### sitemap-delete

Delete a sitemap from a site.

```bash
google-search-console-cli sitemap-delete https://www.example.com/ https://www.example.com/sitemap.xml
```

### inspect

Inspect a URL's index status in Google.

```bash
google-search-console-cli inspect https://www.example.com/ https://www.example.com/my-page

# With a specific language for messages
google-search-console-cli inspect https://www.example.com/ https://www.example.com/my-page --language zh-CN
```

## Error output

Errors are written to stderr as JSON with an `error` field. For Google API errors, `code` and `details` are included when available:

```json
{"error": "Permission denied", "code": 403}
```

## License

Apache-2.0
