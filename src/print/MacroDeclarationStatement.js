import { doc } from "prettier";
import { printTagBody } from "../util/index.js";

const { group, join, line, softline, indent } = doc.builders;

const printOpener = (node, path, print) => {
    const parts = [
        node.trimLeft ? "{%-" : "{%",
        " macro ",
        path.call(print, "name"),
        "("
    ];
    const mappedArguments = path.map(print, "arguments");
    const joinedArguments = join([",", line], mappedArguments);
    parts.push(indent([softline, joinedArguments]));
    parts.push(")", line, node.trimRightMacro ? "-%}" : "%}");
    return group(parts);
};

const printMacroDeclarationStatement = (node, path, print) => {
    const parts = [printOpener(node, path, print)];
    parts.push(...printTagBody(node, path, print, "body"));
    parts.push(
        node.trimLeftEndmacro ? "{%-" : "{%",
        " endmacro ",
        node.trimRight ? "-%}" : "%}"
    );
    return parts;
};

export { printMacroDeclarationStatement };
