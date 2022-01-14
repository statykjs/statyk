import fs from "node:fs";
import glob from "glob";
import fm from "front-matter";
import { marked } from "marked";
import compile from "./compile";
import resolvePath from "../utils/resolvePath";

/**
 * @param {import("../utils/getBuildInfo").BuildInfo} buildInfo
 */
function buildPagesFolder(buildInfo) {
  const pagesFolder = resolvePath(
    buildInfo.BASE_FOLDER,
    buildInfo.PAGES_FOLDER
  );
  const globUrls = glob.sync(`${pagesFolder}/**/*.html`);
  const globMd = glob.sync(`${pagesFolder}/**/*.md`);

  globUrls.forEach((url) => {
    compile(url, buildInfo);
  });

  globMd.forEach((url) => {
    let stack = [];
    let markdown = fs.readFileSync(url, { encoding: "utf-8" });
    const frontmatter = fm(markdown);
    marked.use({
      walkTokens(token) {
        // skip content in mustaches
        if (token.raw.includes("{{")) stack.push("{{");
        if (token.raw.includes("}}")) stack.pop();
        if (stack.length > 0) {
          token.type = "text";
          token.text = token.raw;
        }
      },
    });
    const html = marked(frontmatter.body);
    compile(url, buildInfo, html);
  });
}

export default buildPagesFolder;
