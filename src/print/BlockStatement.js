import { doc } from "prettier";
import { Node, StringLiteral } from "../melody/melody-types/index.js";
import {
    printChildBlock,
    isWhitespaceNode,
    EXPRESSION_NEEDED,
    STRING_NEEDS_QUOTES
} from "../util/index.js";

const { hardline, group } = doc.builders;

const printBlockStatement = (node, path, print, options) => {
    node[EXPRESSION_NEEDED] = false;
    const hasChildren = Array.isArray(node.body);
    const printEndblockName = options.twigOutputEndblockName === true;

    if (hasChildren) {
        const blockName = path.call(print, "name");
        const opener = [
            node.trimLeft ? "{%-" : "{%",
            " block ",
            blockName,
            node.trimRightBlock ? " -%}" : " %}"
        ];
        const parts = [opener];
        const closer = [
            node.trimLeftEndblock ? "{%-" : "{%",
            " endblock",
            printEndblockName ? [" ", blockName] : "",
            node.trimRight ? " -%}" : " %}"
        ];

        // An empty block has nothing to separate. Pushing a hardline for the
        // absent body and another before the closer left a stray blank line
        // inside every `{% block x %}{% endblock %}`.
        if (node.body.length === 0) {
            parts.push(closer);

            return group(parts);
        }

        // A body of nothing but whitespace is blank too, but it did span lines
        // in the source, so keep one break rather than collapsing or doubling.
        if (node.body.every(isWhitespaceNode)) {
            parts.push(hardline, closer);

            return group(parts);
        }

        parts.push(printChildBlock(node, path, print, "body"));
        parts.push(hardline);
        parts.push(closer);

        return group(parts);
    } else if (Node.isPrintExpressionStatement(node.body)) {
        if (node.body.value instanceof StringLiteral) {
            node[STRING_NEEDS_QUOTES] = true;
        }
        return [
            node.trimLeft ? "{%-" : "{%",
            " block ",
            path.call(print, "name"),
            " ",
            path.call(print, "body", "value"),
            node.trimRight ? " -%}" : " %}"
        ];
    }
};

export { printBlockStatement };
