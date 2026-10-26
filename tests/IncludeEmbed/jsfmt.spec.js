import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

/** @type {import('tests_config/run_spec').PrettierOptions} */
const formatOptions = {
    twigFollowOfficialCodingStandards: false
};

describe("Include embed", () => {
    it("should handle block", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "block.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should handle block shortcut", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "block_shortcut.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should handle embed", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "embed.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should keep comments between the blocks of an embed", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "embedComments.twig"
        });
        expect(actual).toContain("{# before the first block #}");
        expect(actual).toContain("{# between blocks #}");
        expect(actual).toContain("{# a second comment, after a blank line #}");
        expect(actual).toContain("{# after the last block #}");
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should handle extends embed", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "extendsEmbed.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should handle import", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "import.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should handle include", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "include.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should handle mount", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "mount.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
    it("should handle use statement", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "useStatement.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
