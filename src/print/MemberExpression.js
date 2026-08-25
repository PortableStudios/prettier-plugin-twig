import { doc } from "prettier";
import {
    needsParenthesesUnderPostfix,
    EXPRESSION_NEEDED,
    STRING_NEEDS_QUOTES,
    wrapExpressionIfNeeded
} from "../util/index.js";

const { group } = doc.builders;

const printMemberExpression = (node, path, print) => {
    node[EXPRESSION_NEEDED] = false;
    node[STRING_NEEDS_QUOTES] = true;
    // `.` and `[]` bind tighter than any infix or prefix operator, so an operand
    // that is one has to keep its parentheses: `(a ?: b).c` is not `a ?: b.c`.
    const objectNeedsParens = needsParenthesesUnderPostfix(node.object);
    const printedObject = path.call(print, "object");
    const parts = objectNeedsParens
        ? ["(", printedObject, ")"]
        : [printedObject];
    // `?.` is Twig's null-safe accessor; dropping the `?` would change behaviour.
    // `computed` here means a numeric property written as `a.0`, which the plain
    // path prints as `a[0]`. There is no bracket form of the null-safe accessor --
    // `a?.[0]` is a Twig syntax error -- so keep the dotted form.
    if (node.nullSafe) {
        parts.push("?.", path.call(print, "property"));
        wrapExpressionIfNeeded(path, parts, node);

        return group(parts);
    }
    parts.push(node.computed ? "[" : ".");
    parts.push(path.call(print, "property"));
    if (node.computed) {
        parts.push("]");
    }
    wrapExpressionIfNeeded(path, parts, node);
    return group(parts);
};

export { printMemberExpression };
