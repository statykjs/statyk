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
import runCode from "./runCode";
import fm from "../libs/frontmatter";
import isEmpty from "lodash/isEmpty";

export const MUSTACHE_REGEX = /\\?\{\{(.+?)\}\}/gs;

/**
 * evaluate mustache in html template
 */
function evaluateMustaches(
  html: string,
  props: Record<string, string>,
  globalVars: Record<string, any>
) {
  regexMatchAll(MUSTACHE_REGEX, html, (match) => {
    const expression = match[1];
    html = html.replace(match[0], runExpression(expression, props, globalVars));
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
  props: Record<string, any>,
  globalVars: Record<string, any>
) {
  let _props: { attr: string; value: string }[] = [];
  Object.keys(attributes).map((attr) => {
    regexMatchAll(MUSTACHE_REGEX, attributes[attr], (match) => {
      const value = nJSON.normalizeSync(
        runExpression(match[1], props, globalVars)
      );
      _props.push({ attr, value });
    });
  });
  return _props;
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

type FmExtractorReturn = {
  isCodeblock: boolean;
  body: string;
  attributes: Record<string, any>;
  code: string | null;
};
function extractFrontmatter(content: string): FmExtractorReturn {
  try {
    const matter = fm(content);
    if (isEmpty(matter.attributes)) {
      return {
        isCodeblock: true,
        body: matter.body,
        attributes: {},
        code: matter.frontmatter || null,
      };
    }
    return {
      isCodeblock: false,
      body: matter.body,
      attributes: matter.attributes as Record<string, any>,
      code: null,
    };
  } catch {}
  return {
    isCodeblock: false,
    body: content,
    attributes: {},
    code: null,
  };
}

const compileTemplate = async (
  html: string,
  baseFolder: string,
  context: Record<string, any> = {},
  globalVars: Record<string, any> = {}
) => {
  const { body, attributes, code, isCodeblock } = extractFrontmatter(html);
  const root = parse(body);
  const includes = root.querySelectorAll("include[src]");
  let codeResult = {};
  if (isCodeblock) {
    codeResult = await runCode(code!, context);
  }
  codeResult = merge(codeResult, attributes);

  // 1.  get all includes and evaluate them but not which are in expression
  // 2.  if found mustache -> evaluate mustaches -> recursive compile
  // 3.  else instanceComponentScript -> evaluateMustaches -> recursive compile

  const mustacheIncludes = findIncludesInMustaches(body);
  for (const include of includes) {
    const foundMustacheIncludes = mustacheIncludes.filter((el) => {
      return el.toString() === include.toString();
    });

    if (foundMustacheIncludes.length > 0) {
      root.innerHTML = evaluateMustaches(root.innerHTML, context, globalVars);
      root.innerHTML = (await compileTemplate(
        root.innerHTML,
        baseFolder,
        context,
        globalVars
      ))!.innerHTML;
      continue;
    }

    const evaluatedProps = evaluateMustachesInProps(
      include.attributes,
      context,
      codeResult
    );
    evaluatedProps.forEach((prop) => {
      include.setAttribute(prop.attr, prop.value);
    });
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url!);
    const shtml = fs.readFileSync(parsedUrl, { encoding: "utf-8" });

    const mergedProps = merge(context, include.attributes);

    const awaited = await compileTemplate(
      instanceComponentScript(
        evaluateSlots(shtml, include.innerHTML),
        parsedUrl,
        mergedProps
      ),
      baseFolder,
      mergedProps,
      codeResult
    );
    include.replaceWith(
      parse(evaluateMustaches(awaited!.innerHTML, mergedProps, codeResult))
    );
  }

  const finalHtml = parse(
    evaluateMustaches(root.innerHTML, context, merge(codeResult, globalVars))
  );
  appendScripts(finalHtml);

  return finalHtml;
};

export default compileTemplate;
