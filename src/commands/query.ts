import { Command } from "commander";
import { createWebmastersClient } from "../auth.js";
import { errorJson, run } from "../utils.js";

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid JSON: ${value}`);
  }
}

function parsePositiveInt(value: string): number {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) {
    throw new Error(`Expected a non-negative integer, got: ${value}`);
  }
  return n;
}

export function registerQueryCommands(program: Command): void {
  program
    .command("query <siteUrl>")
    .description("Query search analytics data")
    .requiredOption("--start-date <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--end-date <date>", "End date (YYYY-MM-DD)")
    .option("--dimensions <names>", "Comma-separated dimensions (date,query,page,country,device,searchAppearance)")
    .option("--type <type>", "Search type (web,image,video,news,discover,googleNews)", "web")
    .option("--dimension-filter <json>", "JSON array of dimension filter groups")
    .option("--aggregation-type <type>", "Aggregation type (auto,byPage,byProperty)")
    .option("--row-limit <n>", "Max rows (1-25000, default 1000)", parsePositiveInt)
    .option("--start-row <n>", "Starting row offset (default 0)", parsePositiveInt)
    .option("--data-state <state>", "Data freshness (all,final,hourly_all)")
    .action(async (siteUrl: string, opts, cmd: Command) => {
      const format = cmd.optsWithGlobals().format;
      await run(async () => {
        const requestBody: Record<string, unknown> = {
          startDate: opts.startDate,
          endDate: opts.endDate,
        };

        if (opts.dimensions) {
          requestBody.dimensions = opts.dimensions.split(",").map((s: string) => s.trim());
        }
        if (opts.type && opts.type !== "web") {
          requestBody.type = opts.type;
        }
        if (opts.dimensionFilter) {
          const filters = parseJson(opts.dimensionFilter);
          if (!Array.isArray(filters)) {
            errorJson("--dimension-filter must be a JSON array of filter groups");
          }
          requestBody.dimensionFilterGroups = filters;
        }
        if (opts.aggregationType) {
          requestBody.aggregationType = opts.aggregationType;
        }
        if (opts.rowLimit != null) {
          requestBody.rowLimit = opts.rowLimit;
        }
        if (opts.startRow != null) {
          requestBody.startRow = opts.startRow;
        }
        if (opts.dataState) {
          requestBody.dataState = opts.dataState;
        }

        const client = await createWebmastersClient();
        const res = await client.searchanalytics.query({
          siteUrl,
          requestBody,
        });
        return res.data;
      }, format);
    });
}
