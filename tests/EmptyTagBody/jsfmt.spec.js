import { run_spec } from "tests_config/run_spec";
import { format } from "prettier";
import plugin from "src/index";
import { describe, expect, it } from "vitest";

/**
 * @param {string} code
 * @param {object} [formatOptions]
 * @returns {Promise<string>}
 */
const formatTwig = (code, formatOptions = {}) =>
    format(code, {
        parser: "twig",
        plugins: [plugin],
        tabWidth: 4,
        ...formatOptions
    });

/**
 * The text a tag encloses, which is what Twig renders for a capture, a macro or
 * a filtered block. Twig drops the first newline after a `%}`, so that one is
 * not part of the body.
 *
 * @param {string} output
 * @param {string} openTag
 * @param {string} closeTag
 * @returns {string}
 */
const bodyBetween = (output, openTag, closeTag) => {
    const start = output.indexOf(openTag) + openTag.length;
    const end = output.indexOf(closeTag, start);
    return output.slice(start, end).replace(/^\n/, "");
};

describe("EmptyTagBody", () => {
    it("should not open a body inside empty tags", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "empty-tag-body.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });

    it("should not open a body inside an empty multi-tag", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "multi-tag.twig",
            formatOptions: {
                twigMultiTags: ["cache,endcache"]
            }
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });

    it.each([
        ["{% macro m() %}", "{% endmacro %}"],
        ["{% set s %}", "{% endset %}"],
        ["{% embed 'child.twig' %}", "{% endembed %}"],
        ["{% spaceless %}", "{% endspaceless %}"],
        ["{% filter upper %}", "{% endfilter %}"],
        ["{% autoescape %}", "{% endautoescape %}"],
        ["{% block b %}", "{% endblock %}"],
        ["{% if x %}", "{% endif %}"],
        ["{% for a in b %}", "{% endfor %}"]
    ])("renders nothing between %s and %s", async (openTag, closeTag) => {
        const output = await formatTwig(openTag + closeTag);
        expect(bodyBetween(output, openTag, closeTag)).toBe("");
    });

    it.each([
        ["{% macro m() %}", "{% endmacro %}"],
        ["{% set s %}", "{% endset %}"],
        ["{% spaceless %}", "{% endspaceless %}"],
        ["{% filter upper %}", "{% endfilter %}"],
        ["{% autoescape %}", "{% endautoescape %}"],
        ["{% block b %}", "{% endblock %}"],
        ["{% if x %}", "{% endif %}"],
        ["{% for a in b %}", "{% endfor %}"]
    ])(
        "renders nothing between %s and %s across a blank body",
        async (openTag, closeTag) => {
            const output = await formatTwig(openTag + "\n" + closeTag);
            expect(bodyBetween(output, openTag, closeTag)).toBe("");
        }
    );

    it("welds an empty multi-tag body", async () => {
        const output = await formatTwig("{% cache %}{% endcache %}", {
            twigMultiTags: ["cache,endcache"]
        });
        expect(output).toBe("{% cache %}{% endcache %}\n");
    });

    it("keeps a non-empty body indented", async () => {
        const output = await formatTwig("{% set s %}kept{% endset %}");
        expect(output).toBe("{% set s %}\n    kept\n{% endset %}\n");
    });
});
