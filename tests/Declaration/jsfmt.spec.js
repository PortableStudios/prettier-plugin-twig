import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("Declaration", () => {
    it("should handle doctype declaration", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "doctype.twig"
        });
        expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});

describe("Declaration casing", () => {
    it("should normalise the doctype to lower case", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "doctype-case.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
