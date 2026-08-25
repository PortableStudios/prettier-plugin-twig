import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("NullSafe", () => {
    it("should handle the null-safe member accessor", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "null-safe.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
