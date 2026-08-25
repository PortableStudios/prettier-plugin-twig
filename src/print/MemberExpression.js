import { doc } from "prettier";
import {
    EXPRESSION_NEEDED,
    STRING_NEEDS_QUOTES,
    wrapExpressionIfNeeded
} from "../util/index.js";

const { group } = doc.builders;

const printMemberExpression = (node, path, print) => {
    node[EXPRESSION_NEEDED] = false;
    node[STRING_NEEDS_QUOTES] = true;
    const parts = [path.call(print, "object")];
    // `?.` is Twig's null-safe accessor; dropping the `?` would change behaviour.
    const accessor = node.computed
        ? node.nullSafe
            ? "?.["
            : "["
        : node.nullSafe
          ? "?."
          : ".";
    parts.push(accessor);
    parts.push(path.call(print, "property"));
    if (node.computed) {
        parts.push("]");
    }
    wrapExpressionIfNeeded(path, parts, node);
    return group(parts);
};

export { printMemberExpression };
