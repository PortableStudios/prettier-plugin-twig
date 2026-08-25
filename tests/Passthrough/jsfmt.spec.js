import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("Passthrough", () => {
    it("should keep a crossing-tree template byte-identical", async () => {
        const { actual, code } = await run_spec(import.meta.url, {
            source: "crossing-trees.twig"
        });
        expect(actual).toBe(code);
    });

    it("should keep a conditional attribute byte-identical", async () => {
        const { actual, code } = await run_spec(import.meta.url, {
            source: "conditional-attribute.twig"
        });
        expect(actual).toBe(code);
    });

    // The passthrough covers failures that escape Parser.parse() -- structural
    // ones, where valid Twig has no representation in this AST. Errors the parser
    // already models as PrintErroredStatement still throw from the printer, so a
    // genuinely malformed tag stays a hard failure rather than being skipped.
    it("should still throw on a malformed tag", async () => {
        const promise = run_spec(import.meta.url, {
            source: "malformed-tag.twig"
        });
        await expect(promise).rejects.toThrow();
    });
});
