import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("AttributeInterpolation", () => {
    it("should not break an interpolation inside an attribute value", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "interpolation.twig",
            formatOptions: { printWidth: 100, tabWidth: 2 }
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
