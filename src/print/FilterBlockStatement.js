import { doc } from "prettier";
import { FILTER_BLOCK, printTagBody } from "../util/index.js";

const { group, line } = doc.builders;

const printOpeningGroup = (node, path, print) => {
    const parts = [node.trimLeft ? "{%- " : "{% "];
    const printedExpression = path.call(print, "filterExpression");
    parts.push(printedExpression, line, node.trimRightFilter ? "-%}" : "%}");
    return group(parts);
};

const printFilterBlockStatement = (node, path, print) => {
    node[FILTER_BLOCK] = true;
    const openingGroup = printOpeningGroup(node, path, print);
    const body = printTagBody(node, path, print, "body");
    const closingStatement = [
        node.trimLeftEndfilter ? "{%-" : "{%",
        " endfilter ",
        node.trimRight ? "-%}" : "%}"
    ];

    return [openingGroup, ...body, closingStatement];
};

export { printFilterBlockStatement };
