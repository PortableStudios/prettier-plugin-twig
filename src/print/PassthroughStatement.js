import { doc } from "prettier";

const { join, literalline } = doc.builders;

/**
 * Emit the template exactly as it arrived. `literalline` keeps the existing line
 * breaks without the doc printer re-indenting them.
 *
 * @typedef {import('../melody/melody-types/index.js').PassthroughStatement} node
 */
const printPassthroughStatement = node =>
    join(literalline, String(node.source).split("\n"));

export { printPassthroughStatement };
