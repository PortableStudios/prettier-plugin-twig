import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("Elvis", () => {
    it("should keep the elvis operator intact", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "elvis.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
