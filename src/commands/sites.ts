import { Command } from "commander";
import { createWebmastersClient, createWriteWebmastersClient } from "../auth.js";
import { run } from "../utils.js";

export function registerSitesCommands(program: Command): void {
  program
    .command("sites")
    .description("List all sites in Search Console")
    .action(async (_opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWebmastersClient();
        const res = await client.sites.list();
        return res.data.siteEntry ?? [];
      }, format);
    });

  program
    .command("site <siteUrl>")
    .description("Get information about a specific site")
    .action(async (siteUrl: string, _opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWebmastersClient();
        const res = await client.sites.get({ siteUrl });
        return res.data;
      }, format);
    });

  program
    .command("site-add <siteUrl>")
    .description("Add a site to Search Console")
    .action(async (siteUrl: string, _opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWriteWebmastersClient();
        await client.sites.add({ siteUrl });
        return { added: siteUrl };
      }, format);
    });

  program
    .command("site-remove <siteUrl>")
    .description("Remove a site from Search Console")
    .action(async (siteUrl: string, _opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWriteWebmastersClient();
        await client.sites.delete({ siteUrl });
        return { removed: siteUrl };
      }, format);
    });
}
