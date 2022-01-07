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
 * evaluate mustache in html template
 * @param {string} html
 * @param {string} children
 * @returns {string}
 */
function evaluateSlots(html, children) {
  const root = parse(html);
  const slots = root.querySelectorAll("slot");
  slots.forEach((slot) => {
    slot.replaceWith(children);
  });
  return root.innerHTML;
}

/**
 * @param {import("node-html-parser/dist/nodes/html").Attributes} element
 * @param {Record<string, any>} vars
 */
function evaluateMustachesInProps(attributes, vars) {
  let props = [];
  Object.keys(attributes).map((attr) => {
    regexMatchAll(MUSTACHE_REGEX, attributes[attr], (match) => {
      const value = JSON.normalizeSync(runExpression(match[1], vars));
      props.push({ attr, value });
    });
  });
  return props;
}

/**
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
    const html = fs.readFileSync(parsedUrl, { encoding: "utf-8" });

    const evaluatedProps = evaluateMustachesInProps(include.attributes, vars);
    evaluatedProps.forEach((prop) => {
      include.setAttribute(prop.attr, prop.value);
    });

    const finalHtml = evaluateMustaches(
      compileTemplate(
        evaluateSlots(html, include.innerHTML),
        baseFolder,
        include.attributes
      ),
      include.attributes
    );
    include.replaceWith(parse(finalHtml));
  });

  return parse(evaluateMustaches(root.innerHTML, vars));
};

export default compileTemplate;
