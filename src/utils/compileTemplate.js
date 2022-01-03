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

    const props = `
      const props = {
        ${Object.keys(globalVars)
          .filter((key) => key !== "src")
          .map((v) => `${v}: "${globalVars[v]}",`)
          .join("\n")}
      };
    `;
    const code = `
      ${props}
      module.exports = ${js};
    `;
    return vm.run(code);
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
const compileTemplate = (html, baseFolder, vars = {}) => {
  const root = parse(html);
  const includes = root.querySelectorAll("include[src]");
  const MUSTACHE_REGEX = /\\?\{\{(.+?)\}\}/gs;

  includes.forEach((include) => {
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url);
    const html = fs.readFileSync(parsedUrl, { encoding: "utf-8" });
    const nestedUrl = path.join(baseFolder, path.dirname(url));

    // Evaluate mustaches in props
    Object.keys(include.attributes).forEach((attr) => {
      regexMatchAll(MUSTACHE_REGEX, include.attributes[attr], (match) => {
        include.setAttribute(attr, runExpression(match[1], vars));
      });
    });

    // evaluate mustache in html template
    function evaluateMustaches(html, attrs) {
      regexMatchAll(MUSTACHE_REGEX, html, (match) => {
        const expression = match[1];
        html = html.replace(match[0], runExpression(expression, attrs));
      });
      return html;
    }

    include.replaceWith(
      parse(
        evaluateMustaches(
          compileTemplate(html, nestedUrl, include.attributes),
          include.attributes
        )
      )
    );
  });

  return root.innerHTML;
};

export default compileTemplate;
