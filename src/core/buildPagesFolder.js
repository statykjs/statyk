// @ts-check
import fs from "node:fs";
import glob from "glob";
import fm from "front-matter";
import { marked } from "marked";
import compile from "./compile";
import resolvePath from "../utils/resolvePath";

/**
 * @param {string} content
 * @returns
 */
export function parseMarkdown(content) {
  const stack = [];

  const frontmatter = fm(content);
  marked.use({
    walkTokens(token) {
      // skip content in mustaches
      if (token.raw.includes("{{")) stack.push("{{");
      if (token.raw.includes("}}")) stack.pop();
      if (stack.length > 0) {
        token.type = "text";
        // @ts-ignore
        token.text = token.raw;
      }
    },
  });
  const html = marked(frontmatter.body);

  return html;
}

/**
 * @param {import("./types").StatykContext} statykCtx
 */
async function buildPagesFolder(statykCtx) {
  const pagesFolder = resolvePath(
    statykCtx.BASE_FOLDER,
    statykCtx.PAGES_FOLDER
  );
  const globUrls = glob.sync(`${pagesFolder}/**/*.html`);
  const globMd = glob.sync(`${pagesFolder}/**/*.md`);

  for (const url of globUrls) {
    await compile(url, statykCtx);
  }

  for (const url of globMd) {
    let markdown = fs.readFileSync(url, { encoding: "utf-8" });
    const html = parseMarkdown(markdown);
    await compile(url, statykCtx, html);
  }
}

export default buildPagesFolder;
