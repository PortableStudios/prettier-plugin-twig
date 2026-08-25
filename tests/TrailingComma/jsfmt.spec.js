import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("TrailingComma", () => {
    it("should omit trailing commas by default", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "trailing-comma.twig",
            suffix: "-none",
            formatOptions: { twigAlwaysBreakObjects: false, printWidth: 80 }
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });

    it("should add trailing commas where a hash or array breaks", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "trailing-comma.twig",
            suffix: "-all",
            formatOptions: {
                twigAlwaysBreakObjects: false,
                printWidth: 80,
                twigTrailingComma: "all"
            }
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
