import path from "node:path";
import fs from "fs-extra";
import normalizePath from "./normalizePath";
import { buildConfig, PAGES_REGEX } from "../build";
import prettier from "prettier";

const formatCode = (code) => {
  return prettier.format(code, { parser: "html" });
};

/**
 * @param {HTMLElement} root
 * @param {string} filePath
 */
function writeToOutput(root, filePath) {
  // remove pages folder
  const finalFolder = filePath.replace(PAGES_REGEX, "");
  fs.ensureDirSync(
    path.join(buildConfig.OUTPUT_FOLDER, path.dirname(finalFolder))
  );

  // change link to # if the link is the same page as current page
  const normalizedPath = normalizePath(finalFolder).replace(/^\//, "");
  const selector = `a[href="/${normalizedPath}"]`;

  const aLinks = root.querySelectorAll(selector);
  aLinks.forEach((link) => link.setAttribute("href", "#"));

  fs.writeFileSync(
    path.join(buildConfig.OUTPUT_FOLDER, finalFolder.replace(".md", ".html")),
    formatCode(root.toString())
  );
}

export default writeToOutput;
