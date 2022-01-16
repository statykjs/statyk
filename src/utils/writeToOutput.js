import path from "node:path";
import fs from "fs-extra";
import normalizePath from "./normalizePath";
import prettier from "prettier";
import { HTMLElement } from "node-html-parser";

/**
 * @param {string} code
 * @returns {string}
 */
const formatCode = (code) => {
  return prettier.format(code, { parser: "html" });
};

/**
 * @param {HTMLElement} root
 * @param {string} filePath
 * @param {import("../core/types").StatykContext} statykCtx
 */
function writeToOutput(root, filePath, statykCtx) {
  const pagesRegex = new RegExp(`^\\b${statykCtx.PAGES_FOLDER}\\b`);

  // remove pages folder
  const finalFolder = filePath.replace(pagesRegex, "");
  fs.ensureDirSync(
    path.join(statykCtx.OUTPUT_FOLDER, path.dirname(finalFolder))
  );

  // change link to # if the link is the same page as current page
  const normalizedPath = normalizePath(finalFolder).replace(/^\//, "");
  const selector = `a[href="/${normalizedPath}"]`;

  const aLinks = root.querySelectorAll(selector);
  aLinks.forEach((link) => link.setAttribute("href", "#"));

  fs.writeFileSync(
    path.join(statykCtx.OUTPUT_FOLDER, finalFolder.replace(".md", ".html")),
    formatCode(root.toString())
  );
}

export default writeToOutput;
