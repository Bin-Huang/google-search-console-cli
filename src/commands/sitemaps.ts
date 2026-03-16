import { Command } from "commander";
import { createWebmastersClient, createWriteWebmastersClient } from "../auth.js";
import { run } from "../utils.js";

export function registerSitemapsCommands(program: Command): void {
  program
    .command("sitemaps <siteUrl>")
    .description("List sitemaps for a site")
    .option("--sitemap-index <url>", "Only list sitemaps under this sitemap index")
    .action(async (siteUrl: string, opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWebmastersClient();
        const params: Record<string, string> = { siteUrl };
        if (opts.sitemapIndex) params.sitemapIndex = opts.sitemapIndex;
        const res = await client.sitemaps.list(params);
        return res.data.sitemap ?? [];
      }, format);
    });

  program
    .command("sitemap <siteUrl> <feedpath>")
    .description("Get information about a specific sitemap")
    .action(async (siteUrl: string, feedpath: string, _opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWebmastersClient();
        const res = await client.sitemaps.get({ siteUrl, feedpath });
        return res.data;
      }, format);
    });

  program
    .command("sitemap-submit <siteUrl> <feedpath>")
    .description("Submit a sitemap for a site")
    .action(async (siteUrl: string, feedpath: string, _opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWriteWebmastersClient();
        await client.sitemaps.submit({ siteUrl, feedpath });
        return { submitted: feedpath, site: siteUrl };
      }, format);
    });

  program
    .command("sitemap-delete <siteUrl> <feedpath>")
    .description("Delete a sitemap from a site")
    .action(async (siteUrl: string, feedpath: string, _opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWriteWebmastersClient();
        await client.sitemaps.delete({ siteUrl, feedpath });
        return { deleted: feedpath, site: siteUrl };
      }, format);
    });
}
