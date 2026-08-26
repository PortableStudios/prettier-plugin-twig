import isBoolean from "lodash/isBoolean.js";
import { printTagBody, quoteChar } from "../util/index.js";

const printEscapeType = (escapeType, options) => {
    if (escapeType === null) {
        return [];
    }

    if (isBoolean(escapeType)) {
        return [escapeType ? "true" : "false", " "];
    }

    return [quoteChar(options), escapeType, quoteChar(options), " "];
};

const createOpener = (node, options) => {
    return [
        node.trimLeft ? "{%-" : "{%",
        " autoescape ",
        ...printEscapeType(node.escapeType, options),
        node.trimRightAutoescape ? "-%}" : "%}"
    ];
};

const printAutoescapeBlock = (node, path, print, options) => {
    const parts = [createOpener(node, options)];
    parts.push(...printTagBody(node, path, print, "expressions"));
    parts.push(
        node.trimLeftEndautoescape ? "{%-" : "{%",
        " endautoescape ",
        node.trimRight ? "-%}" : "%}"
    );

    return parts;
};

export { printAutoescapeBlock };
