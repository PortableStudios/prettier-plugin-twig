import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("InlineWhitespace", () => {
    it("should not introduce whitespace inside inline elements", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "inline-element.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
