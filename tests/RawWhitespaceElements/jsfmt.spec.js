import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

const between = (text, open, close) => {
    const i = text.indexOf(open);
    const j = text.indexOf(close, i);
    return i < 0 || j < 0 ? null : text.slice(i + open.length, j);
};

describe("RawWhitespaceElements", () => {
    it("should preserve pre, textarea, verbatim and apply bodies", async () => {
        const { actual, code, snapshotFile } = await run_spec(import.meta.url, {
            source: "raw2.twig"
        });

        // Whitespace in all four is data, not layout: pre and textarea render it
        // literally, verbatim emits its body untouched, and apply pipes it into a
        // filter where line breaks can be significant.
        for (const [open, close] of [
            ["<pre>", "</pre>"],
            ["<textarea>", "</textarea>"],
            ["{% verbatim %}", "{% endverbatim %}"],
            ["{% apply markdown_to_html %}", "{% endapply %}"]
        ]) {
            expect(between(actual, open, close)).toBe(between(code, open, close));
        }

        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
