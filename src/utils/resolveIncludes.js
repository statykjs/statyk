import path from "node:path";
import fs from "node:fs";
import { parse } from "node-html-parser";
import { NodeVM } from "vm2";
import logger from "./logger";
import regexMatchAll from "./regexMatchAll";

/**
 * @param {string} js
 * @returns {string}
 */
const runExpression = (js, globalVars = {}) => {
  try {
    const vm = new NodeVM({
      require: {
        external: true,
      },
    });

    return vm.run(`
    const props = {${Object.keys(globalVars)
      .map((v) => `${v}: "${globalVars[v]}",`)
      .join("\n")}};
    module.exports = ${js}`);
  } catch (err) {
    logger.warn(err);
  }
};

/**
 *
 * @param {string} html
 * @param {string} baseFolder
 * @returns
 */
const resolveIncludes = (html, baseFolder, vars = {}) => {
  const root = parse(html);
  const includes = root.querySelectorAll("include[src]");

  includes.forEach((include) => {
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url);
    const html = fs.readFileSync(parsedUrl, { encoding: "utf-8" });
    const nestedUrl = path.join(baseFolder, path.dirname(url));

    const CURLY_REGEX = /\{\{([^}]+)\}\}/;
    const CURLY_REGEX_ALL = /\{\{([^}]+)\}\}/gim;
    Object.keys(include.attributes).forEach((attr) => {
      const match = include.attributes[attr].match(CURLY_REGEX);
      if (attr && match) {
        include.setAttribute(attr, runExpression(match[1], vars));
      }
    });

    function interpolateCurly(html, attrs) {
      const { matches } = regexMatchAll(CURLY_REGEX_ALL, html);
      matches.forEach((match) => {
        const expression = match[1];
        html = html.replace(match[0], runExpression(expression, attrs));
      });
      return html;
    }

    include.replaceWith(
      parse(
        interpolateCurly(
          resolveIncludes(html, nestedUrl, include.attributes),
          include.attributes
        )
      )
    );
  });

  return root.innerHTML;
};

export default resolveIncludes;
