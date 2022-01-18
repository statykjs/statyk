// @ts-check
import fs from "node:fs";
import path from "node:path";
import { HTMLElement, Node, parse } from "node-html-parser";
import merge from "lodash/merge";
// @ts-ignore
import nJSON from "json-normalize";

import { coreRuntime } from "./compile";
import runExpression from "./runExpression";
import regexMatchAll from "../utils/regexMatchAll";
import instanceComponentScript from "./instanceComponentScript";
import { Attributes } from "node-html-parser/dist/nodes/html";

export const MUSTACHE_REGEX = /\\?\{\{(.+?)\}\}/gs;

/**
 * evaluate mustache in html template
 */
function evaluateMustaches(html: string, attrs: Record<string, string>) {
  regexMatchAll(MUSTACHE_REGEX, html, (match) => {
    const expression = match[1];
    html = html.replace(match[0], runExpression(expression, attrs));
  });

  return html;
}

/**
 * evaluate mustache in html template
 */
export function evaluateSlots(html: string, children: string | Node) {
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
 */
function appendScripts(root: HTMLElement) {
  const scriptCache = coreRuntime.caches.scripts;

  scriptCache.keys().forEach((scriptKey) => {
    const value = scriptCache.get(scriptKey);
    if (!value) return;

    // only append to body, if the script is not already appended
    const body = root.querySelector("body");
    if (!body || value.appended) return;

    const script = value.content;
    const instances = value.instances.join("\n");
    body.insertAdjacentHTML(
      "afterend",
      `<script>${script}${instances}</script>`
    );

    value!.el!.remove();
    scriptCache.put(scriptKey, {
      ...value,
      appended: true,
      el: null,
    });
  });
}

function evaluateMustachesInProps(
  attributes: Attributes,
  vars: Record<string, any>
) {
  let props: { attr: string; value: string }[] = [];
  Object.keys(attributes).map((attr) => {
    regexMatchAll(MUSTACHE_REGEX, attributes[attr], (match) => {
      const value = nJSON.normalizeSync(runExpression(match[1], vars));
      props.push({ attr, value });
    });
  });
  return props;
}

/**
 * Not in use
 */
const resolveIncludes = (html: string, baseFolder: string) => {
  const root = parse(html);

  const includes = root.querySelectorAll("include[src]");

  includes.forEach((include) => {
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url!);
    const html = fs.readFileSync(parsedUrl, { encoding: "utf-8" });

    const finalHtml = resolveIncludes(html, baseFolder);

    include.innerHTML = evaluateSlots(finalHtml, include.innerHTML);
  });

  return root.innerHTML;
};

/**
 * finds and returns all <include /> elements inside mustaches
 */
const findIncludesInMustaches = (html: string): HTMLElement[] => {
  let includes: HTMLElement[] = [];
  regexMatchAll(MUSTACHE_REGEX, html, (match) => {
    const expression = match[1];
    const parsedHtml = parse(expression);
    includes.push(...parsedHtml.querySelectorAll("include[src]"));
  });
  return includes;
};

const compileTemplate = (html: string, baseFolder: string, vars: Record<string, any> = {}) => {
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
    const parsedUrl = path.resolve(baseFolder, url!);
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
          mergedProps
        )
      )
    );
  });

  const finalHtml = parse(evaluateMustaches(root.innerHTML, vars));
  appendScripts(finalHtml);

  return finalHtml;
};

export default compileTemplate;
