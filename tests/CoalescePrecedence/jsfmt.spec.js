import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("CoalescePrecedence", () => {
    it("should keep parentheses around a coalesce used as an operand", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "coalesce-precedence.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
