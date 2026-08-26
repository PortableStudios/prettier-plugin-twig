import { doc } from "prettier";
import { EXPRESSION_NEEDED, printTagBody } from "../util/index.js";

const { group, indent, line } = doc.builders;

const printFor = (node, path, print) => {
    const parts = [node.trimLeft ? "{%-" : "{%", " for "];
    if (node.keyTarget) {
        parts.push(path.call(print, "keyTarget"), ", ");
    }
    parts.push(
        path.call(print, "valueTarget"),
        " in ",
        path.call(print, "sequence")
    );
    if (node.condition) {
        parts.push(indent([line, "if ", path.call(print, "condition")]));
    }
    parts.push([" ", node.trimRightFor ? "-%}" : "%}"]);
    return group(parts);
};

const printForStatement = (node, path, print) => {
    node[EXPRESSION_NEEDED] = false;
    const parts = [printFor(node, path, print)];
    parts.push(...printTagBody(node, path, print, "body"));
    if (node.otherwise) {
        parts.push(
            node.trimLeftElse ? "{%-" : "{%",
            " else ",
            node.trimRightElse ? "-%}" : "%}"
        );
        parts.push(...printTagBody(node, path, print, "otherwise"));
    }
    parts.push(
        node.trimLeftEndfor ? "{%-" : "{%",
        " endfor ",
        node.trimRight ? "-%}" : "%}"
    );

    return parts;
};

export { printForStatement };
