import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("FilteredLiteralContract", () => {
    it("should keep the delimiters welded to a filtered literal", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "filteredLiteral.twig",
            formatOptions: { twigAlwaysBreakObjects: false, printWidth: 80 }
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
