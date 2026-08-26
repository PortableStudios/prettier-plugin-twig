import { doc } from "prettier";
import { Node, StringLiteral } from "../melody/melody-types/index.js";
import {
    printTagBody,
    EXPRESSION_NEEDED,
    STRING_NEEDS_QUOTES
} from "../util/index.js";

const { group } = doc.builders;

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
        const closer = [
            node.trimLeftEndblock ? "{%-" : "{%",
            " endblock",
            printEndblockName ? [" ", blockName] : "",
            node.trimRight ? " -%}" : " %}"
        ];

        return group([
            opener,
            ...printTagBody(node, path, print, "body"),
            closer
        ]);
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
