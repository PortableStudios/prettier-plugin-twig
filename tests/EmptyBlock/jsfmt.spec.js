import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("EmptyBlock", () => {
    it("should keep empty blocks on one line", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "empty-block.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
