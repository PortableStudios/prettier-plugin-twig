import { doc } from "prettier";
import {
    printVerbatimNodes,
    removeSurroundingWhitespace,
    isInlineElement,
    isOwnlineElement,
    isWhitespaceInsensitiveInlineElement,
    startsWithWhitespace,
    endsWithWhitespace,
    printChildGroups,
    EXPRESSION_NEEDED,
    STRING_NEEDS_QUOTES
} from "../util/index.js";
import { ORIGINAL_SOURCE } from "../parser.js";

const { group, line, hardline, softline, indent, join } = doc.builders;

/**
 * @param {boolean} weldContent Omit the closing ">" so the caller can weld it to
 *   the element's content, letting the tag break without the break becoming
 *   rendered whitespace.
 */
const printOpeningTag = (node, path, print, options, weldContent = false) => {
    const groupId = Symbol("opening-tag");

    const opener = "<" + node.name;
    const printedAttributes = printSeparatedList(path, print, "", "attributes");
    const hasAttributes = node.attributes && node.attributes.length > 0;

    if (weldContent) {
        if (hasAttributes) {
            return group([opener, indent([line, printedAttributes])], {
                id: groupId
            });
        }
        return group([opener], { id: groupId });
    }

    const openingTagEnd = [];
    if (node.selfClosing) {
        if (!options.bracketSameLine) {
            openingTagEnd.push(line);
        } else {
            openingTagEnd.push(" ");
        }
        openingTagEnd.push("/>");
    } else {
        if (!options.bracketSameLine) {
            openingTagEnd.push(softline);
        }
        openingTagEnd.push(">");
    }

    if (hasAttributes) {
        return group(
            [opener, indent([line, printedAttributes]), openingTagEnd],
            { id: groupId }
        );
    }

    return group([opener, openingTagEnd], { id: groupId });
};

const printSeparatedList = (path, print, separator, attrName) => {
    return join([separator, line], path.map(print, attrName));
};

/**
 * Elements whose content is not markup. The HTML spec calls these raw text
 * elements: everything up to the closing tag is data, so reflowing it as text
 * breaks the language inside -- a line break lands mid string literal, and code
 * after a `//` comment ends up inside it.
 *
 * @type {string[]}
 */
const RAW_TEXT_ELEMENTS = [
    "script",
    "style",
    // `pre` and `textarea` render whitespace literally, so reflowing them is an
    // output change -- in a textarea, a change to the value the form submits.
    // `listing`, `plaintext` and `xmp` are their obsolete equivalents. Checked
    // against prettier's HTML printer: these seven are exactly the elements it
    // preserves byte-for-byte, and nothing else is.
    "pre",
    "textarea",
    "listing",
    "plaintext",
    "xmp"
];

const closingTagFor = node => ["</", node.name, ">"];

const printElement = (node, path, print, options) => {
    // Whitespace at a truly-inline element's content boundary is rendered, so it
    // can be neither invented nor dropped. inline-block elements (button) are
    // excluded: the browser trims their boundary whitespace, so the plain path is
    // safe. Void elements have no content boundary at all.
    const isWhitespaceSensitive =
        isInlineElement(node) &&
        !node.selfClosing &&
        !isWhitespaceInsensitiveInlineElement(node);

    // Whether the source had whitespace decides how each end is printed, and it
    // must be read before removeSurroundingWhitespace/createTextGroups drop it.
    const hadLeadingWhitespace =
        isWhitespaceSensitive && startsWithWhitespace(node.children);
    const hadTrailingWhitespace =
        isWhitespaceSensitive && endsWithWhitespace(node.children);
    const weldOpen = isWhitespaceSensitive && !hadLeadingWhitespace;
    const weldClose = isWhitespaceSensitive && !hadTrailingWhitespace;

    // Set a flag in case attributes contain, e.g., a FilterExpression
    node[EXPRESSION_NEEDED] = true;
    const openingGroup = group(
        printOpeningTag(node, path, print, options, weldOpen)
    );
    node[EXPRESSION_NEEDED] = false;
    node[STRING_NEEDS_QUOTES] = false;

    if (node.selfClosing) {
        return openingGroup;
    }

    const groupElement = Symbol("element");

    // Raw text elements are emitted exactly as written. Prettier core hands these
    // to its JS/CSS printers, which isn't available here: the body may be
    // interleaved with Twig output tags that no JS or CSS parser accepts.
    // HTML tag names are case-insensitive, so `<SCRIPT>` is a script too.
    if (RAW_TEXT_ELEMENTS.indexOf(String(node.name).toLowerCase()) > -1) {
        const source = path.stack.length
            ? path.stack[0][ORIGINAL_SOURCE]
            : null;
        const verbatim = printVerbatimNodes(source, node.children);
        if (verbatim) {
            return group(
                [openingGroup, verbatim, hardline, closingTagFor(node)],
                {
                    id: groupElement
                }
            );
        }
    }

    node.children = removeSurroundingWhitespace(node.children);

    const childGroups = printChildGroups(node, path, print, "children");
    const result = [openingGroup];
    const joinedChildren = childGroups;

    if (isWhitespaceSensitive) {
        // A boundary that had whitespace renders as one collapsible space, so
        // `line` reproduces it — a space when flat, a newline when broken.
        // `softline` is wrong here: flat it emits nothing, silently deleting the
        // space. A boundary that had none must never gain any, so the bracket
        // travels with the content and the break moves inside the tag:
        //     <span class="price"
        //         >text that wrapped</span
        //     >
        const contents = [];
        contents.push(weldOpen ? [softline, ">"] : line);
        contents.push(joinedChildren);
        if (weldClose) {
            contents.push("</", node.name);
        }
        result.push(indent(contents));
        // The closing bracket gets its own group so it only leaves the line when
        // it genuinely doesn't fit. Sharing the element's group made it break
        // whenever the opening tag did, stranding a lone ">" under every element
        // whose attributes were long -- and a break here is optional either way,
        // since neither form adds rendered whitespace.
        result.push(
            weldClose ? group([softline, ">"]) : [line, "</", node.name, ">"]
        );

        return group(result, { id: groupElement });
    }

    const closingTag = ["</", node.name, ">"];
    if (isOwnlineElement(node) || isInlineElement(node)) {
        const element = [indent([softline, joinedChildren]), softline];
        result.push(element);
    } else {
        const childBlock = [];
        if (childGroups.length > 0) {
            childBlock.push(hardline);
        }
        childBlock.push(joinedChildren);
        result.push(indent(childBlock));
        if (childGroups.length > 0) {
            result.push(hardline);
        }
    }
    result.push(closingTag);

    return group(result, { id: groupElement });
};

export { printElement };
