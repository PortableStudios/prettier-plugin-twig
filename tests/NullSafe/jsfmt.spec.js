import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("NullSafe", () => {
    it("should handle the null-safe member accessor", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "null-safe.twig"
        });
        // There is no bracket form of the accessor: `a?.[0]` is a Twig syntax
        // error, so a numeric property keeps the dotted form.
        expect(actual).toContain("{{ a?.0 }}");
        expect(actual).not.toContain("?.[");

        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
