import { Command } from "commander";
import { createWebmastersClient, createWriteWebmastersClient } from "../auth.js";
import { run } from "../utils.js";

// An empty list is a valid result, so stdout still gets [] and the exit code
// stays 0. The hint goes to stderr for humans and agents.
export function warnIfNoSites(sites: unknown[]): void {
  if (sites.length > 0) return;
  process.stderr.write(
    "No sites found. These credentials have no access to any Search Console property yet. " +
    "Add the service account email (client_email in the key file) as a user on each property, " +
    "or wait if you added it recently. " +
    "See https://github.com/Bin-Huang/google-search-console-cli#step-4-grant-access-in-search-console\n",
  );
}

export function registerSitesCommands(program: Command): void {
  program
    .command("sites")
    .description("List all sites in Search Console")
    .action(async (_opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const client = await createWebmastersClient();
        const res = await client.sites.list();
        const sites = res.data.siteEntry ?? [];
        warnIfNoSites(sites);
        return sites;
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
