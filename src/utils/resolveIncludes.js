import path from "node:path";
import fs from "node:fs";
import { parse } from "node-html-parser";

/**
 *
 * @param {string} html
 * @param {string} baseFolder
 * @returns
 */
const resolveIncludes = (html, baseFolder) => {
  const root = parse(html);
  const includes = root.querySelectorAll("include[src]");

  includes.forEach((include) => {
    const url = include.getAttribute("src");
    const parsedUrl = path.resolve(baseFolder, url);
    const html = fs.readFileSync(parsedUrl, { encoding: "utf-8" });
    const nestedUrl = path.join(baseFolder, path.dirname(url));
    include.replaceWith(resolveIncludes(html, nestedUrl));
  });

  return root.innerHTML;
};

export default resolveIncludes;
