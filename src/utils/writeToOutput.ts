import path from "node:path";
import fs from "fs-extra";
import normalizePath from "./normalizePath";
import prettier from "prettier";
import { HTMLElement } from "node-html-parser";
import { StatykContext } from "../core/types";

const formatCode = (code: string) => {
  return prettier.format(code, { parser: "html" });
};

function writeToOutput(root: HTMLElement, filePath: string, statykCtx: StatykContext) {
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
