import path from "node:path";
import fs from "node:fs";
import { parse } from "node-html-parser";
import regexMatchAll from "./regexMatchAll";
import runExpression from "./runExpression";
import JSON from "json-normalize";

export const MUSTACHE_REGEX = /\\?\{\{(.+?)\}\}/gs;

/**
 * evaluate mustache in html template
 * @param {string} html
 * @param {Record<string, string>} attrs
 * @returns {string}
 */
function evaluateMustaches(html, attrs) {
  regexMatchAll(MUSTACHE_REGEX, html, (match) => {
    const expression = match[1];
    html = html.replace(match[0], runExpression(expression, attrs));
  });
  return html;
}

/**
 *
 * @param {string} html
 * @param {string} baseFolder
 * @returns
 */
const compileTemplate = (html, baseFolder, vars = {}) => {
  const root = parse(html);
  const includes = root.querySelectorAll("include[src]");

  includes.forEach((include) => {
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url);
    const nestedUrl = path.join(baseFolder, path.dirname(url));
    const html = fs.readFileSync(parsedUrl, { encoding: "utf-8" });

    // Evaluate mustaches in props
    Object.keys(include.attributes).forEach((attr) => {
      regexMatchAll(MUSTACHE_REGEX, include.attributes[attr], (match) => {
        const value = JSON.normalizeSync(runExpression(match[1], vars));
        include.setAttribute(attr, value);
      });
    });

    include.replaceWith(
      parse(
        evaluateMustaches(
          compileTemplate(html, nestedUrl, include.attributes),
          include.attributes
        )
      )
    );
  });

  return parse(evaluateMustaches(root.innerHTML, vars));
};

export default compileTemplate;
