import { run_spec } from "tests_config/run_spec";
import { describe, expect, it } from "vitest";

/** Body of `{% tag %}…{% endtag %}`, or null. */
const bodyOf = (text, tag) => {
    const m = new RegExp(`\\{% ${tag} %\\}([\\s\\S]*?)\\{% end${tag} %\\}`).exec(
        text
    );
    return m ? m[1] : null;
};

describe("RawTags", () => {
    it("should emit js and css bodies byte-for-byte", async () => {
        const { actual, code, snapshotFile } = await run_spec(import.meta.url, {
            source: "raw.twig",
            formatOptions: {
                twigMultiTags: ["js,endjs", "css,endcss", "cache,endcache"]
            }
        });

        // Reflowing these as markup breaks the script: a line break lands inside
        // a string literal, and code after a `//` comment moves onto the comment.
        for (const tag of ["js", "css"]) {
            expect(bodyOf(actual, tag)).toBe(bodyOf(code, tag));
        }

        // A tag that isn't raw must still be formatted.
        expect(bodyOf(actual, "cache")).not.toBe(bodyOf(code, "cache"));

        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });
});
