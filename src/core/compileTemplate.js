import path from "node:path";
import fs from "node:fs";
import { parse } from "node-html-parser";
import regexMatchAll from "../utils/regexMatchAll";
import runExpression from "./runExpression";
import JSON from "json-normalize";
import { merge } from "lodash-es";
import instanceComponentScript, {
  scriptCache,
} from "./instanceComponentScript";

export const MUSTACHE_REGEX = /\\?\{\{(.+?)\}\}/gs;

/**
 * evaluate mustache in html template
 * @param {string} html
 * @param {Record<string, string>} attrs
 * @returns {{ html: string, includes: HTMLElement[] }}
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
export function evaluateSlots(html, children) {
  const root = parse(html);
  const slots = root.querySelectorAll("slot");
  slots.forEach((slot) => {
    if (children === "" && slot.innerHTML !== "") return;
    slot.replaceWith(children);
  });
  return root.innerHTML;
}

/**
 * append component instance scripts
 * @param {HTMLElement} root
 */
function appendScripts(root) {
  Object.keys(scriptCache).forEach((scriptKey) => {
    if (!scriptCache[scriptKey]) return;
    const body = root.querySelector("body");
    // only append to body, if the script is not already appended
    if (!body || scriptCache[scriptKey].appended) return;

    const script = scriptCache[scriptKey].content;
    const instances = scriptCache[scriptKey].instances.join("\n");
    body.insertAdjacentHTML(
      "afterend",
      `<script>${script}${instances}</script>`
    );
    scriptCache[scriptKey].appended = true;
    scriptCache[scriptKey].el.remove();
  });
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

const resolveIncludes = (html, baseFolder) => {
  const root = parse(html);

  const includes = root.querySelectorAll("include[src]");

  includes.forEach((include) => {
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url);
    const html = fs.readFileSync(parsedUrl, { encoding: "utf-8" });

    const finalHtml = resolveIncludes(html, baseFolder);

    include.innerHTML = parse(evaluateSlots(finalHtml, include.innerHTML));
  });

  return root.innerHTML;
};

const findIncludesInMustaches = (html) => {
  let includes = [];
  regexMatchAll(MUSTACHE_REGEX, html, (match) => {
    const expression = match[1];
    const parsedHtml = parse(expression);
    includes.push(...parsedHtml.querySelectorAll("include[src]"));
  });
  return includes;
};

/**
 * @param {string} html
 * @param {string} baseFolder
 * @returns
 */
const compileTemplate = (html, baseFolder, vars = {}) => {
  const root = parse(html);
  const includes = root.querySelectorAll("include[src]");

  // 1.  get all includes and evaluate them but not which are in expression
  // 2.  if found mustache -> evaluate mustaches -> recursive compile
  // 3.  else instanceComponentScript -> evaluateMustaches -> recursive compile

  const mustacheIncludes = findIncludesInMustaches(html);
  includes.forEach((include) => {
    const foundMustacheIncludes = mustacheIncludes.filter((el) => {
      return el.toString() === include.toString();
    });
    if (foundMustacheIncludes.length > 0) {
      root.innerHTML = evaluateMustaches(root.innerHTML, vars);
      root.innerHTML = compileTemplate(
        root.innerHTML,
        baseFolder,
        vars
      ).innerHTML;
      return;
    }

    const evaluatedProps = evaluateMustachesInProps(include.attributes, vars);
    evaluatedProps.forEach((prop) => {
      include.setAttribute(prop.attr, prop.value);
    });
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url);
    const shtml = fs.readFileSync(parsedUrl, { encoding: "utf-8" });
    const mergedProps = merge(vars, include.attributes);

    include.replaceWith(
      parse(
        evaluateMustaches(
          compileTemplate(
            instanceComponentScript(
              evaluateSlots(shtml, include.innerHTML),
              parsedUrl,
              mergedProps
            ),
            baseFolder,
            mergedProps
          ).innerHTML,
          include.innerHTML
        )
      )
    );
  });

  const finalHtml = parse(evaluateMustaches(root.innerHTML, vars));
  appendScripts(finalHtml);

  return finalHtml;
};

export default compileTemplate;
