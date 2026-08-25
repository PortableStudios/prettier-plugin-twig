import { doc } from "prettier";
import { STRING_NEEDS_QUOTES, OVERRIDE_QUOTE_CHAR } from "../util/index.js";

const { fill, join } = doc.builders;

const printDeclaration = (node, path, print) => {
    node[STRING_NEEDS_QUOTES] = true;
    node[OVERRIDE_QUOTE_CHAR] = '"';
    const declarationType = node.declarationType || "";
    const printedParts = path.map(print, "parts");

    // Match prettier's HTML printer: the bare HTML5 doctype is normalised to
    // lower case, but a legacy doctype carrying a public/system identifier keeps
    // the conventional upper-case keyword.
    //     <!DOCTYPE html>                     -> <!doctype html>
    //     <!DOCTYPE HTML PUBLIC "-//W3C//..." -> <!DOCTYPE HTML PUBLIC "-//W3C//..."
    const isSimpleDoctype = printedParts.length <= 1;
    const start =
        "<!" +
        (isSimpleDoctype
            ? declarationType.toLowerCase()
            : declarationType.toUpperCase());

    return fill([start, " ", join(" ", printedParts), ">"]);
};

export { printDeclaration };
