# google-search-console-cli

Google Search Console CLI & Skills for AI agents (and humans). Analyze search performance by query, page, country, and device, inspect URL index status, manage sitemaps, and more.

**Works with:** OpenClaw, Claude Code, Cursor, Codex, and any agent that can run shell commands.

## Installation

Tell your AI agent (e.g. OpenClaw):

> Install this CLI and skills from https://github.com/Bin-Huang/google-search-console-cli

Or install manually:

```bash
npm install -g google-search-console-cli

# Add skills for AI agents (Claude Code, Cursor, Codex, etc.)
npx skills add Bin-Huang/google-search-console-cli
```

Or run directly: `npx google-search-console-cli --help`

In Claude Code, you can also install the skills as a plugin:

```
/plugin marketplace add Bin-Huang/google-search-console-cli
/plugin install google-search-console-cli@google-search-console-cli
```

For development:

```bash
pnpm install
pnpm build
```

## How it works

Built on Google's official APIs. Handles service account authentication and request signing. Every command outputs structured JSON to stdout, ready for agents to parse without extra processing.

Core APIs covered:

- **[Search Console API v1](https://developers.google.com/webmaster-tools/v1/api_reference_index)** -- URL inspection (`inspect`)
- **[Webmasters API v3](https://developers.google.com/webmaster-tools/v1/api_reference_index)** -- search analytics, sites, and sitemaps (`query`, `sites`, `sitemaps`)

Under the hood it uses the official Node.js client library [`googleapis`](https://www.npmjs.com/package/googleapis). All API responses are passed through as JSON.

## Setup

### Step 1: Choose a project and enable the API

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and select a project. If you do not have a project, create one.
2. Open the [Search Console API page](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com) in the API Library and click **Enable**.

### Step 2: Create a service account and download a JSON key

1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) in the same project.
2. Click **Create Service Account**, give it a name (e.g. `search-console-reader`), and click **Done**.
3. Click the new service account and open the **Keys** tab.
4. Click **Add Key > Create new key > JSON**. The browser downloads the key file.

> [!NOTE]
> **Key creation blocked?** Your organization can block service account key creation with the `constraints/iam.managed.disableServiceAccountKeyCreation` policy. Organizations created on or after May 3, 2024 enforce this policy by default. See [Secure-by-default organizations](https://docs.cloud.google.com/resource-manager/docs/secure-by-default-organizations) and [Create and delete service account keys](https://cloud.google.com/iam/docs/keys-create-delete).
>
> To fix this, ask your organization admin to override the policy for this project. Or use [Application Default Credentials](#alternative-application-default-credentials) instead of a key.

### Step 3: Place the credentials file

The CLI looks for credentials in this order and uses the first one it finds:

1. `--credentials <path>` flag
2. `GOOGLE_APPLICATION_CREDENTIALS` env var
3. `~/.config/google-search-console-cli/credentials.json` (default path)
4. gcloud Application Default Credentials (see [below](#alternative-application-default-credentials))

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

### Step 4: Grant access in Search Console

The service account needs permission on each Search Console property. You must be an **Owner** of a property to add users to it ([Google help](https://support.google.com/webmasters/answer/7687615)).

1. Open [Google Search Console](https://search.google.com/search-console).
2. Select the property.
3. Go to **Settings** (bottom-left) > **Users and permissions**.
4. Click **Add user**.
5. Enter the service account email. Copy it from the `client_email` field in your key file, e.g. `my-sa@my-project.iam.gserviceaccount.com`.
6. Choose a permission level. Do not choose **Owner**.
   - **Restricted** (read-only): can use `sites`, `site`, `query`, `sitemaps`, `sitemap`, `inspect`, `inspect-batch`
   - **Full**: can also use `site-add`, `site-remove`, `sitemap-submit`, `sitemap-delete`
7. Click **Add**.

Repeat for each property. Search Console has no option to add a user to all properties at once.

If Search Console shows "Email not found", see [Troubleshooting](#troubleshooting).

### Step 5: Verify the setup

```bash
google-search-console-cli sites
```

The command prints the properties that the credentials can access. If it prints `[]`, the access from Step 4 is not active yet. The CLI also writes a warning to stderr in this case. See [Troubleshooting](#troubleshooting).

## Alternative: Application Default Credentials

Use this method to sign in with your own Google account instead of a service account. Use it when Search Console does not accept the service account email, or when your organization blocks key creation. The CLI then has the same Search Console access as your Google account.

Before you start:

- Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install).
- In the project from Step 1, configure the [OAuth consent screen](https://console.cloud.google.com/auth/branding). If you are not in a Google Workspace organization, choose the **External** audience.
- With the **External** audience, add your own Google account as a test user on the [Audience](https://console.cloud.google.com/auth/audience) page.

Steps:

1. Go to [Google Auth Platform > Clients](https://console.cloud.google.com/auth/clients) and click **Create client**.
2. Choose the application type **Desktop app**, then click **Create**.
3. Download the client JSON file, e.g. as `client_secret.json`. This file is not a service account key. Do not pass it to `--credentials`.
4. Sign in with your own OAuth client:

   ```bash
   gcloud auth application-default login \
     --client-id-file=/path/to/client_secret.json \
     --scopes="https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform"
   ```

5. Bill API usage to the project from Step 1:

   ```bash
   gcloud auth application-default set-quota-project YOUR_PROJECT_ID
   ```

6. Run `google-search-console-cli sites` to verify.

Notes:

- gcloud requires the `cloud-platform` scope. For write commands (`site-add`, `sitemap-submit`, etc.), use `https://www.googleapis.com/auth/webmasters` instead of `webmasters.readonly`.
- Without `--client-id-file`, gcloud uses its own OAuth client. Google usually blocks that client for the Search Console scope and shows "This app is blocked".
- The CLI uses Application Default Credentials only when it finds no key file (see the order in Step 3). Unset `GOOGLE_APPLICATION_CREDENTIALS`, and remove or rename `~/.config/google-search-console-cli/credentials.json` if it exists.
- While the OAuth app uses the **External** audience and its publishing status is **Testing**, Google expires the refresh token after 7 days ([Google docs](https://developers.google.com/identity/protocols/oauth2)). Run the login command again every 7 days.
- This method is good for local development. For automation, use a service account.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Search Console shows "Email not found" when you add the service account | You entered a different value, such as `client_id` or an OAuth client ID. | Enter the `client_email` value from the key file. It ends in `.iam.gserviceaccount.com`. Make sure the service account is enabled in the Cloud Console. |
| Search Console shows "Email not found" for the correct `client_email` | This is a known Google-side problem. Search Console can reject a new service account for several hours to several weeks ([forum thread](https://discuss.google.dev/t/problem-with-new-service-accounts/362176)). The CLI cannot fix it. | Try again later. To start now, use [Application Default Credentials](#alternative-application-default-credentials). |
| `sites` prints `[]` (stderr has a `warning`) | The credentials work, but they have no access to any property yet. | Do [Step 4](#step-4-grant-access-in-search-console) for each property. Check that you added the same `client_email` that is in your key file. With Application Default Credentials, check that your Google account has access to the property. |
| `{"error": "No credentials found. ..."}` | The CLI found no key file and no Application Default Credentials. | Place the key file as described in [Step 3](#step-3-place-the-credentials-file). |
| `... is an OAuth client file, not a service account key` | The credentials file is an OAuth client file. It has an `installed` or `web` field. | Download a service account key from the **Keys** tab ([Step 2](#step-2-create-a-service-account-and-download-a-json-key)). Or use the OAuth client file with `gcloud --client-id-file` ([Application Default Credentials](#alternative-application-default-credentials)). |
| 403 with `SERVICE_DISABLED` or "has not been used in project" | The Search Console API is not enabled in the project of the credentials (or the quota project for Application Default Credentials). | [Enable the API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com) in that project. Wait a few minutes, then try again. |
| 403 "User does not have sufficient permission for site". With `inspect`: 403 "You do not own this site, or the inspected URL is not part of this property". With `site`: 404 "is not a verified Search Console site in this account" | The credentials have no access to this property, or only **Restricted** access for a write command. | Add the account to the property ([Step 4](#step-4-grant-access-in-search-console)). Use **Full** for write commands. Check that the site URL matches the property exactly, e.g. `https://www.example.com/` or `sc-domain:example.com`. |
| Google shows "This app is blocked" during `gcloud auth application-default login` | gcloud's own OAuth client cannot request the Search Console scope. | Create your own OAuth client and add `--client-id-file` ([Application Default Credentials](#alternative-application-default-credentials)). |
| Application Default Credentials stop working after 7 days (`invalid_grant`) | The OAuth app uses the **External** audience and is in **Testing** status. Google expires its refresh tokens after 7 days. | Run `gcloud auth application-default login` again with the same flags. |
| A service account key fails with `invalid_grant: ...`, e.g. `invalid_grant: Invalid grant: account not found` | The key or the service account was deleted or disabled. | Create a new key ([Step 2](#step-2-create-a-service-account-and-download-a-json-key)) and replace the old key file. If you deleted the service account, create a new one and repeat [Step 4](#step-4-grant-access-in-search-console). |

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

Available dimensions: `date`, `query`, `page`, `country`, `device`, `searchAppearance`, `hour`

Available types: `web` (default), `image`, `video`, `news`, `discover`, `googleNews`

Additional options:

- `--row-limit <n>` -- Max rows, 1-25000 (default 1000)
- `--start-row <n>` -- Starting row offset (default 0)
- `--data-state <state>` -- Data freshness: `all`, `final`, `hourly_all`
- `--aggregation-type <type>` -- Aggregation type: `auto`, `byPage`, `byProperty`, `byNewsShowcasePanel`
- `--all` -- Fetch all rows with auto-pagination (mutually exclusive with `--start-row`)

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

Add a site to the Search Console account of the credentials. The site stays unverified after you add it, so the CLI gets no data for it. To get data, verify ownership in Search Console, or ask an owner to add the account as a user ([Step 4](#step-4-grant-access-in-search-console)).

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

# Only list sitemaps under a specific sitemap index
google-search-console-cli sitemaps https://www.example.com/ \
  --sitemap-index https://www.example.com/sitemap-index.xml
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

### inspect-batch

Batch inspect multiple URLs' index status in a single command.

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

Progress is written to stderr. With `--format compact`, each result is streamed as NDJSON (one JSON object per line) as it completes. With the default format, all results are collected and output as a JSON array. Per-URL errors are captured in the output (with `error` and, when available, `code`) without stopping the batch. If any URL could not be inspected (an API or request error, not a `FAIL` verdict), the command still prints all results, then writes a summary error to stderr and exits with code 1.

## Error output

Errors are written to stderr as JSON with an `error` field. For Google API errors, `code` and `details` are included when available:

```json
{"error": "Permission denied", "code": 403}
```

Warnings are written to stderr as JSON with a `warning` field. They do not change stdout or the exit code. For example, `sites` writes a warning when it finds no sites.

## Related

- [google-analytics-cli](https://github.com/Bin-Huang/google-analytics-cli) -- Google Analytics CLI & Skills for AI agents (and humans)
- [youtube-analytics-cli](https://github.com/Bin-Huang/youtube-analytics-cli) -- YouTube Analytics CLI & Skills for AI agents (and humans)
- [x-analytics-cli](https://github.com/Bin-Huang/x-analytics-cli) -- X Analytics CLI & Skills for AI agents (and humans)
- [camoufox-cli](https://github.com/Bin-Huang/camoufox-cli) -- Anti-detect browser CLI & Skills for AI agents
- [google-ads-open-cli](https://github.com/Bin-Huang/google-ads-open-cli) -- Google Ads CLI & Skills for AI agents (and humans)
- [meta-ads-open-cli](https://github.com/Bin-Huang/meta-ads-open-cli) -- Meta Ads CLI & Skills for AI agents (and humans)
- [microsoft-ads-cli](https://github.com/Bin-Huang/microsoft-ads-cli) -- Microsoft Ads CLI & Skills for AI agents (and humans)
- [amazon-ads-open-cli](https://github.com/Bin-Huang/amazon-ads-open-cli) -- Amazon Ads CLI & Skills for AI agents (and humans)
- [tiktok-ads-cli](https://github.com/Bin-Huang/tiktok-ads-cli) -- TikTok Ads CLI & Skills for AI agents (and humans)
- [linkedin-ads-cli](https://github.com/Bin-Huang/linkedin-ads-cli) -- LinkedIn Ads CLI & Skills for AI agents (and humans)
- [x-ads-cli](https://github.com/Bin-Huang/x-ads-cli) -- X Ads CLI & Skills for AI agents (and humans)
- [snapchat-ads-cli](https://github.com/Bin-Huang/snapchat-ads-cli) -- Snapchat Ads CLI & Skills for AI agents (and humans)
- [pinterest-ads-cli](https://github.com/Bin-Huang/pinterest-ads-cli) -- Pinterest Ads CLI & Skills for AI agents (and humans)
- [reddit-ads-cli](https://github.com/Bin-Huang/reddit-ads-cli) -- Reddit Ads CLI & Skills for AI agents (and humans)
- [spotify-ads-cli](https://github.com/Bin-Huang/spotify-ads-cli) -- Spotify Ads CLI & Skills for AI agents (and humans)
- [apple-ads-cli](https://github.com/Bin-Huang/apple-ads-cli) -- Apple Ads CLI & Skills for AI agents (and humans)

## License

Apache-2.0
