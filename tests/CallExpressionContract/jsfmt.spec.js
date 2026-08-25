import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("CallExpressionContract", () => {
    it("should keep {{ }} welded to a call expression", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "attr.twig",
            formatOptions: { twigAlwaysBreakObjects: false, printWidth: 80 }
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
