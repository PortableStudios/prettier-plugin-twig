import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("MacroDefaults", () => {
    it("should handle any expression as a macro default value", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "macro-defaults.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
