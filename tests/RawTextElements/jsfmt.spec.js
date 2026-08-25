import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

/** Body of `<tag>…</tag>`, minus the closing tag's own indentation. */
const bodyOf = (text, tag) => {
    const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(text);
    return m ? m[1].replace(/\n[ \t]*$/, "\n") : null;
};

describe("RawTextElements", () => {
    it("should emit script and style bodies byte-for-byte", async () => {
        const { actual, code, snapshotFile } = await run_spec(import.meta.url, {
            source: "raw-elements.twig"
        });

        // Reflowing these joins consecutive `//` comments onto one line, which
        // comments out the code that followed them. Only the closing tag's own
        // indentation may change.
        for (const tag of ["script", "style"]) {
            expect(bodyOf(actual, tag)).toBe(bodyOf(code, tag));
        }

        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
