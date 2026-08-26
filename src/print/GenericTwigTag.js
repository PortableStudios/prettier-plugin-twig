import { doc } from "prettier";
import { Node } from "../melody/melody-types/index.js";
import {
    STRING_NEEDS_QUOTES,
    indentWithHardline,
    printSingleTwigTag,
    isEmptySequence
} from "../util/index.js";
import { ORIGINAL_SOURCE } from "../parser.js";

const { hardline, join, literalline } = doc.builders;

const DEFAULT_RAW_TAGS = ["js", "css", "script"];

/**
 * Emit a section exactly as it was written, with `literalline` so the doc printer
 * neither re-indents nor reflows it.
 *
 * @param {string} source The whole original template
 * @param {object} section
 * @returns {doc.builders.Doc}
 */
const sectionEndIndex = section => {
    // The section's own loc.end runs two characters past its content, into the
    // `{%` that opens the end tag, so take the end of its last child instead.
    const children = section.expressions;
    if (Array.isArray(children) && children.length) {
        const last = children[children.length - 1];
        if (
            last.loc &&
            last.loc.end &&
            typeof last.loc.end.index === "number"
        ) {
            return last.loc.end.index;
        }
    }
    return section.loc.end.index;
};

const printVerbatimSection = (source, section) => {
    const raw = source
        .substring(section.loc.start.index, sectionEndIndex(section))
        // Drop the final line break and the end tag's indentation: the printer
        // emits its own hardline before the closing tag.
        .replace(/\n[ \t]*$/, "");

    return join(literalline, raw.split("\n"));
};

const canPrintVerbatim = (source, section) =>
    typeof source === "string" &&
    section.loc &&
    section.loc.start &&
    section.loc.end &&
    typeof section.loc.start.index === "number" &&
    typeof section.loc.end.index === "number";

const printGenericTwigTag = (node, path, print, options) => {
    node[STRING_NEEDS_QUOTES] = true;
    const openingTag = printSingleTwigTag(node, path, print);
    const parts = [openingTag];

    // A `{% js %}` or `{% css %}` body is JavaScript or CSS, not markup. Printing
    // it as template text reflows it like prose, which puts line breaks inside
    // string literals and moves code onto the tail of a `//` comment -- both of
    // which break the script. Emit the source range untouched instead.
    const rawTags = options.twigRawTags || DEFAULT_RAW_TAGS;
    const source = path.stack.length ? path.stack[0][ORIGINAL_SOURCE] : null;
    const isRawTag = rawTags.indexOf(node.tagName) > -1;

    // Printing a section drops its surrounding whitespace, so a whitespace-only
    // body is indistinguishable from an empty one afterwards. Record which
    // sections held nothing at all before that happens.
    const wasEmpty = node.sections.map(
        section => !Node.isGenericTwigTag(section) && isEmptySequence(section)
    );

    const printedSections = path.map(print, "sections");
    node.sections.forEach((section, i) => {
        if (Node.isGenericTwigTag(section)) {
            // Nothing stood between this tag and the one before it, so keep them
            // welded: a break here would become the tag's own output.
            const isWelded = i === 0 || wasEmpty[i - 1];
            parts.push(
                isWelded ? printedSections[i] : [hardline, printedSections[i]]
            );
        } else if (!isEmptySequence(section)) {
            if (isRawTag && canPrintVerbatim(source, section)) {
                parts.push(printVerbatimSection(source, section));
            } else {
                parts.push(indentWithHardline(printedSections[i]));
            }
        }
    });
    return parts;
};

export { printGenericTwigTag };
