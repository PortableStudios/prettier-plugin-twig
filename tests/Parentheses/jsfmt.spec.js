import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

describe("Parentheses", () => {
    // Dropping parentheses that carry precedence silently changes what the
    // template computes: `a ?? (b ? c : d)` becomes `(a ?? b) ? c : d`, and
    // `-(a + b)` becomes `-a + b`.
    it("should keep parentheses that carry precedence", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "parens.twig"
        });

        expect(actual).toContain("{{ a ?? (b ? c : d) }}");
        expect(actual).toContain("(a + b)");
        expect(actual).toContain("not (a and b)");
        expect(actual).toContain("(a ? b : c) ~ d");

        // `|`, `.` and `[]` bind tighter than any infix or prefix operator, so a
        // multipart operand under one of them keeps its parentheses too.
        expect(actual).toContain("(-1)|abs");
        expect(actual).toContain("(a ?: b).c");
        expect(actual).toContain("('q' ~ 'r')[0]");

        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
