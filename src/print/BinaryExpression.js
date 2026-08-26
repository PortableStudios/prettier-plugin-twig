import { doc } from "prettier";
import { Node } from "../melody/melody-types/index.js";
import { extension as coreExtension } from "../melody/melody-extension-core/index.js";
import {
    EXPRESSION_NEEDED,
    STRING_NEEDS_QUOTES,
    INSIDE_OF_STRING,
    GROUP_TOP_LEVEL_LOGICAL,
    IS_ROOT_LOGICAL_EXPRESSION,
    firstValueInAncestorChain,
    findParentNode,
    wrapExpressionIfNeeded
} from "../util/index.js";

const { group, line, softline, indent } = doc.builders;
const ALREADY_INDENTED = Symbol("ALREADY_INDENTED");
const OPERATOR_PRECEDENCE = Symbol("OPERATOR_PRECEDENCE");
const NO_WHITESPACE_AROUND = [".."];

const operatorPrecedence = coreExtension.binaryOperators.reduce((acc, curr) => {
    acc[curr.text] = curr.precedence;
    return acc;
}, {});

const printInterpolatedString = (node, path, print, options) => {
    node[STRING_NEEDS_QUOTES] = false;
    node[INSIDE_OF_STRING] = true;

    const printedFragments = ['"']; // For interpolated strings, we HAVE to use double quotes
    let currentNode = node;
    const currentPath = [];
    while (Node.isBinaryConcatExpression(currentNode)) {
        printedFragments.unshift(path.call(print, ...currentPath, "right"));
        currentPath.push("left");
        currentNode = currentNode.left;
    }
    printedFragments.unshift(path.call(print, ...currentPath));
    printedFragments.unshift('"');
    return printedFragments;
};

const operatorNeedsSpaces = operator => {
    return NO_WHITESPACE_AROUND.indexOf(operator) < 0;
};

const hasLogicalOperator = node => {
    return node.operator === "or" || node.operator === "and";
};

const isCoalesceOperator = node => {
    return (
        Node.isBinaryNullCoalesceExpression(node) ||
        Node.isBinaryEmptyCoalesceExpression(node)
    );
};

// Left-associative operators for which re-associating the right operand changes
// the result. `a - (b - c)` is not `a - b - c`, and `a / (b * c)` is not
// `a / b * c`. Their associative counterparts at the same precedence (`+`, `*`)
// are safe to leave bare, so they stay out of this list to avoid adding noise.
const NON_ASSOCIATIVE = ["-", "/", "//", "%"];

const otherNeedsParentheses = (node, otherProp) => {
    const other = node[otherProp];
    const isBinaryOther = Node.isBinaryExpression(other);
    const ownPrecedence = operatorPrecedence[node.operator];
    const otherPrecedence = isBinaryOther
        ? operatorPrecedence[node[otherProp].operator]
        : Number.MAX_SAFE_INTEGER;
    return (
        otherPrecedence < ownPrecedence ||
        (otherPrecedence > ownPrecedence &&
            isBinaryOther &&
            hasLogicalOperator(other)) ||
        Node.isFilterExpression(other) ||
        // A ternary has lower precedence than every binary operator, so as an
        // operand it always needs parentheses -- not just under `~`. Without
        // them `a ?? (b ? c : d)` reassociates to `(a ?? b) ? c : d`, which is a
        // different expression.
        Node.isConditionalExpression(other) ||
        // `??` and `???` sit at precedence 300 today, so the table above says an
        // operand of a tighter-binding operator needs no parentheses -- and
        // under current Twig that is true. But Twig 3.15 deprecated the
        // unparenthesised form ahead of moving `??` to precedence 5 in the next
        // major, at which point `(x ?? 9) + 0` and `x ?? 9 + 0` stop agreeing.
        // Emitting the parentheses keeps output warning-free now and correct
        // after that change. Fixing it here rather than lowering the table value
        // is deliberate: that value also drives the parser, so lowering it would
        // silently re-associate existing unparenthesised source.
        // A coalesce directly inside another coalesce is exempt: `a ?? b ?? c`
        // means the same under either grouping, so parenthesising it is pure
        // noise.
        (isCoalesceOperator(other) && !isCoalesceOperator(node)) ||
        // Equal precedence on the right of a non-associative operator. The
        // precedence comparisons above only catch a *looser* operand, so this
        // case fell through and the parentheses were dropped -- silently turning
        // `(1 - t) / (w * r)` into `(1 - t) / w * r`, a different number.
        (otherProp === "right" &&
            isBinaryOther &&
            otherPrecedence === ownPrecedence &&
            NON_ASSOCIATIVE.indexOf(node.operator) > -1)
    );
};

const internalPrintBinaryExpression = (node, path, print) => {
    node[EXPRESSION_NEEDED] = false;
    node[STRING_NEEDS_QUOTES] = true;

    const isBinaryRight = Node.isBinaryExpression(node.right);
    const isLogicalOperator = ["and", "or"].indexOf(node.operator) > -1;
    const whitespaceAroundOperator = operatorNeedsSpaces(node.operator);

    const alreadyIndented = firstValueInAncestorChain(
        path,
        ALREADY_INDENTED,
        false
    );
    if (!alreadyIndented && isBinaryRight) {
        node.right[ALREADY_INDENTED] = true;
    }
    const foundRootAbove = firstValueInAncestorChain(
        path,
        IS_ROOT_LOGICAL_EXPRESSION,
        false
    );

    const parentNode = findParentNode(path);
    const shouldGroupOnTopLevel = parentNode[GROUP_TOP_LEVEL_LOGICAL] !== false;

    if (!foundRootAbove) {
        node[IS_ROOT_LOGICAL_EXPRESSION] = true;
    }
    const parentOperator = foundRootAbove
        ? firstValueInAncestorChain(path, "operator")
        : "";

    node[OPERATOR_PRECEDENCE] = operatorPrecedence[node.operator];

    const printedLeft = path.call(print, "left");
    const printedRight = path.call(print, "right");

    const parts = [];
    const leftNeedsParens = otherNeedsParentheses(node, "left");
    const rightNeedsParens = otherNeedsParentheses(node, "right");

    if (leftNeedsParens) {
        parts.push("(");
    }
    parts.push(printedLeft);
    if (leftNeedsParens) {
        parts.push(")");
    }
    const potentiallyIndented = [
        whitespaceAroundOperator ? line : softline,
        node.operator,
        whitespaceAroundOperator ? " " : ""
    ];
    if (rightNeedsParens) {
        potentiallyIndented.push("(");
    }
    potentiallyIndented.push(printedRight);
    if (rightNeedsParens) {
        potentiallyIndented.push(")");
    }
    const rightHandSide = alreadyIndented
        ? potentiallyIndented
        : indent(potentiallyIndented);
    const result = wrapExpressionIfNeeded(
        path,
        [...parts, rightHandSide],
        node
    );
    const shouldCreateTopLevelGroup = !foundRootAbove && shouldGroupOnTopLevel;
    const isDifferentLogicalOperator =
        isLogicalOperator && node.operator !== parentOperator;

    const shouldGroupResult =
        shouldCreateTopLevelGroup ||
        !isLogicalOperator ||
        (foundRootAbove && isDifferentLogicalOperator);

    return shouldGroupResult ? group(result) : result;
};

const printBinaryExpression = (node, path, print, options) => {
    if (Node.isBinaryConcatExpression(node) && node.wasImplicitConcatenation) {
        return printInterpolatedString(node, path, print, options);
    }
    return internalPrintBinaryExpression(node, path, print);
};

export { printBinaryExpression };
