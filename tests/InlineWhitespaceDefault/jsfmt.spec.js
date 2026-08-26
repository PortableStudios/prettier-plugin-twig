import { run_spec } from "tests_config/run_spec";
import { format } from "prettier";
import plugin from "src/index";
import { describe, expect, it } from "vitest";

/**
 * @param {string} code
 * @returns {Promise<string>}
 */
const formatTwig = code =>
    format(code, { parser: "twig", plugins: [plugin], tabWidth: 4 });

/**
 * Wraps a child between two words so the whitespace on either side of it is
 * rendered text, then formats the result.
 *
 * @param {string} child
 * @returns {Promise<string>}
 */
const formatBetweenWords = child => formatTwig(`<p>alpha ${child} omega</p>`);

describe("InlineWhitespaceDefault", () => {
    it("should keep the whitespace beside inline children", async () => {
        const { actual, snapshotFile } = await run_spec(import.meta.url, {
            source: "inline-children.twig"
        });
        await expect(actual).toMatchFileSnapshot(snapshotFile);
    });

    it.each([
        ["{% if flag %}x{% endif %}"],
        ["{% for i in list %}{{ i }}{% endfor %}"],
        ["{% set n = 1 %}"],
        ["{{ value }}"],
        ["<span>x</span>"],
        ['<svg viewBox="0 0 1 1"></svg>'],
        ['<input type="text">'],
        ["<select><option>x</option></select>"],
        ["<textarea></textarea>"],
        ["<video></video>"],
        ["<picture></picture>"],
        ["<canvas></canvas>"],
        ["<iframe></iframe>"],
        ["<output>x</output>"],
        ["<del>x</del>"],
        ["<ins>x</ins>"],
        ["<u>x</u>"],
        ["<bdi>x</bdi>"],
        ['<data value="1">x</data>'],
        ["<wbr>"],
        ["<ruby>x</ruby>"],
        ["<slot></slot>"],
        ["<template>x</template>"],
        ["<meter>x</meter>"],
        ["<progress>x</progress>"],
        ["<object></object>"],
        ["<map></map>"],
        ["<embed>"],
        ["<button>x</button>"],
        ["<brand-shape></brand-shape>"],
        ["<my-widget>x</my-widget>"]
    ])("keeps a space either side of %s", async child => {
        const output = await formatBetweenWords(child);
        expect(output).toMatch(/alpha\s/);
        expect(output).toMatch(/\somega/);
    });

    it.each([
        ["<div>x</div>"],
        ["<p>x</p>"],
        ["<ul><li>x</li></ul>"],
        ["<ol><li>x</li></ol>"],
        ["<li>x</li>"],
        ["<dd>x</dd>"],
        ["<dt>x</dt>"],
        ["<table><tr><td>x</td></tr></table>"],
        ["<section>x</section>"],
        ["<figure>x</figure>"],
        ["<details><summary>x</summary></details>"],
        ["<fieldset><legend>x</legend></fieldset>"],
        ["<pre>x</pre>"],
        ["<h1>x</h1>"],
        ["<hr>"],
        ["<form></form>"],
        ["<nav>x</nav>"],
        ["<blockquote>x</blockquote>"]
    ])("drops the space either side of block-level %s", async child => {
        const output = await formatBetweenWords(child);
        expect(output).toMatch(/alpha</);
        expect(output).toMatch(/>omega/);
    });
});
