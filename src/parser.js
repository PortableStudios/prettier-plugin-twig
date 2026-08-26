import {
    CharStream,
    Lexer,
    TokenStream,
    Parser
} from "./melody/melody-parser/index.js";
import { PassthroughStatement } from "./melody/melody-types/index.js";
import { extension as coreExtension } from "./melody/melody-extension-core/index.js";
import { createTestExpression } from "./melody/melody-extension-core/operators.js";

const ORIGINAL_SOURCE = Symbol("ORIGINAL_SOURCE");

const createConfiguredLexer = (code, ...extensions) => {
    const lexer = new Lexer(new CharStream(code));
    for (const extension of extensions) {
        if (extension.unaryOperators) {
            lexer.addOperators(...extension.unaryOperators.map(op => op.text));
        }
        if (extension.binaryOperators) {
            lexer.addOperators(...extension.binaryOperators.map(op => op.text));
        }
    }
    return lexer;
};

const applyParserExtensions = (parser, ...extensions) => {
    for (const extension of extensions) {
        if (extension.tags) {
            for (const tag of extension.tags) {
                parser.addTag(tag);
            }
        }
        if (extension.unaryOperators) {
            for (const op of extension.unaryOperators) {
                parser.addUnaryOperator(op);
            }
        }
        if (extension.binaryOperators) {
            for (const op of extension.binaryOperators) {
                parser.addBinaryOperator(op);
            }
        }
        if (extension.tests) {
            for (const test of extension.tests) {
                parser.addTest(test);
            }
        }
    }
};

const createConfiguredParser = (code, multiTagConfig, ...extensions) => {
    const parser = new Parser(
        new TokenStream(createConfiguredLexer(code, ...extensions), {
            ignoreWhitespace: true,
            ignoreComments: false,
            ignoreHtmlComments: false,
            applyWhitespaceTrimming: false
        }),
        {
            ignoreComments: false,
            ignoreHtmlComments: false,
            ignoreDeclarations: false,
            decodeEntities: false,
            multiTags: multiTagConfig,
            allowUnknownTags: true
        }
    );
    applyParserExtensions(parser, ...extensions);
    return parser;
};

const getMultiTagConfig = (tagsCsvs = []) =>
    tagsCsvs.reduce((acc, curr) => {
        const tagNames = curr.split(",");
        acc[tagNames[0].trim()] = tagNames.slice(1).map(s => s.trim());
        return acc;
    }, {});

const registerTestExtensions = (testExpressions = []) => {
    testExpressions.forEach(test =>
        createTestExpression(test, `Test[${test}]Expression`)
    );
};

const DEFAULT_RAW_TAGS = ["js", "css", "script", "verbatim", "apply", "filter"];

/**
 * A raw tag only reaches the verbatim printer if it is also a registered
 * multi-tag, so register each one automatically. Without this, twigRawTags is
 * inert on its own and the body it promises to protect is reflowed as prose.
 *
 * @param {string[]} multiTags
 * @param {string[]} rawTags
 * @returns {string[]}
 */
const withRawTagsRegistered = (multiTags, rawTags) => {
    const declared = new Set(
        multiTags.map(entry => String(entry).split(",")[0].trim())
    );
    const missing = rawTags
        .filter(tag => !declared.has(tag))
        .map(tag => `${tag},end${tag}`);

    return [...multiTags, ...missing];
};

const parse = (text, parsers, options) => {
    const multiTagConfig = getMultiTagConfig(
        withRawTagsRegistered(
            options.twigMultiTags || [],
            options.twigRawTags || DEFAULT_RAW_TAGS
        )
    );
    registerTestExtensions(options.twigTestExpressions || []);

    const extensions = [coreExtension];
    const parser = createConfiguredParser(text, multiTagConfig, ...extensions);

    let ast;
    try {
        ast = parser.parse();
    } catch (cause) {
        // Twig control flow and the HTML tree don't have to nest, so some valid
        // templates have no representation in this AST at all -- a tag opened in
        // one branch and closed in another, for instance. Throwing makes those a
        // failed build; keeping the file verbatim leaves it merely unformatted,
        // which is what an unrepresentable template deserves. The warning is the
        // signal that it happened.
        // Name the file: over a whole corpus a bare message doesn't say which one
        // stopped being formatted, and --check still exits 0.
        const where = options.filepath ? ` ${options.filepath}:` : "";
        console.warn(
            `[prettier-plugin-twig]${where} left unformatted, could not parse: ${cause.message}`
        );
        ast = new PassthroughStatement(text, cause);
    }

    ast[ORIGINAL_SOURCE] = text;
    return ast;
};

export { parse, ORIGINAL_SOURCE };
