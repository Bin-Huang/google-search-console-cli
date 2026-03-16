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

## Setup

### Step 1: Enable the Search Console API

Go to the [Google Cloud Console API Library](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com) and enable the **Google Search Console API** for your project. If you don't have a project yet, create one first.

You also need to enable the **Search Console API (webmasters v3)** for search analytics queries:
[Enable Webmasters API](https://console.cloud.google.com/apis/library/webmasters.googleapis.com)

### Step 2: Create a Service Account

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) in the same project.
2. Click **Create Service Account**, give it a name (e.g. `search-console-reader`), and click **Done**.
3. Click on the newly created Service Account, go to the **Keys** tab.
4. Click **Add Key > Create new key > JSON**, and download the key file.

### Step 3: Place the credentials file

Choose one of these options:

```bash
# Option A: Default path (recommended)
mkdir -p ~/.config/google-search-console-cli
cp ~/Downloads/your-key-file.json ~/.config/google-search-console-cli/credentials.json

# Option B: Environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-key-file.json"

# Option C: Pass per command
google-search-console-cli sites --credentials /path/to/your-key-file.json
```

Credentials are resolved in this order:
1. `--credentials <path>` flag
2. `GOOGLE_APPLICATION_CREDENTIALS` env var
3. `~/.config/google-search-console-cli/credentials.json` (auto-detected)
4. gcloud Application Default Credentials

### Step 4: Grant access in Search Console

The Service Account needs permission to access your sites in Search Console. This must be done **per site**.

1. Open [Google Search Console](https://search.google.com/search-console).
2. Select a site you want to grant access to.
3. Go to **Settings** (bottom-left) > **Users and permissions**.
4. Click **Add user**.
5. Enter the Service Account email (find it in your key file's `client_email` field, e.g. `my-sa@my-project.iam.gserviceaccount.com`).
6. Choose a permission level:
   - **Restricted** (read-only): can use `sites`, `site`, `query`, `sitemaps`, `sitemap`, `inspect`
   - **Full**: can also use `site-add`, `site-remove`, `sitemap-submit`, `sitemap-delete`
7. Click **Add**.

Repeat for each site you want to access. There is no global "add to all sites" option in Search Console.

### Alternative: gcloud ADC (for local development)

If you prefer not to use a Service Account, you can authenticate with your own Google account:

```bash
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/webmasters.readonly"
```

This uses your personal Google account's Search Console access. Good for local development, not recommended for automation.

## Usage

All commands output pretty-printed JSON by default. Use `--format compact` for compact single-line JSON.

Site URLs follow the Search Console format:
- **URL-prefix property**: `https://www.example.com/` (must include trailing slash)
- **Domain property**: `sc-domain:example.com`

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

Add a site to Search Console. Requires **Full** permission.

```bash
google-search-console-cli site-add https://www.example.com/
```

### site-remove

Remove a site from Search Console. Requires **Full** permission.

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

Submit a sitemap for a site. Requires **Full** permission.

```bash
google-search-console-cli sitemap-submit https://www.example.com/ https://www.example.com/sitemap.xml
```

### sitemap-delete

Delete a sitemap from a site. Requires **Full** permission.

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
