import { doc } from "prettier";
import {
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
        result.push(weldClose ? [softline, ">"] : [line, "</", node.name, ">"]);

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
