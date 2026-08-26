import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("OperatorAssociativity", () => {
    it("should keep parentheses that carry meaning for non-associative operators", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "operator-associativity.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
