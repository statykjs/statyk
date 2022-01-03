import fs from "fs-extra";
import path from "node:path";
import { parse } from "node-html-parser";
// import { marked } from "marked";
// import glob from "glob";
// import fm from "front-matter";
// import { kebabCase } from "lodash-es";
import { cosmiconfigSync } from "cosmiconfig";
import cache from "memory-cache";

import compileTemplate from "./utils/compileTemplate";
import copyAssets from "./utils/copyAssets";
import logger from "./utils/logger";
import resolvePath from "./utils/resolvePath";

const explorer = cosmiconfigSync("deadsimple");
const { config } = explorer.load(".deadsimplerc");

const INPUT_FILE = path.resolve(config.input);
const BASE_FOLDER = path.dirname(config.input);
const OUTPUT_FOLDER = config.out;

let compilationCache = {};
fs.emptyDirSync(OUTPUT_FOLDER);

function compile(inputFile = INPUT_FILE) {
  cache.put(inputFile, true);

  const fileName = path.basename(inputFile);
  const fileContent = fs.readFileSync(inputFile, { encoding: "utf-8" });
  const root = parse(fileContent);

  logger.log(`\nBuilding ${fileName}`, "magentaBright");

  root.innerHTML = compileTemplate(root.innerHTML, BASE_FOLDER);

  copyAssets(BASE_FOLDER, OUTPUT_FOLDER);

  // relinkHyperlinks(root, OUTPUT_FOLDER);

  const LIVE_RELOAD_SCRIPT = `
  <script>
    document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
  </script>
  `;
  root.set_content(`
    ${root.innerHTML} 
    ${LIVE_RELOAD_SCRIPT}
  `);

  // const contentIncludes = root.querySelectorAll("[data-include-content]");

  // contentIncludes.forEach((include) => {
  //   const url = include.getAttribute("data-include-content");
  //   const globUrls = glob.sync(resolvePath(OUTPUT_FOLDER, url));

  //   globUrls.forEach((globUrl) => {
  //     let markdown = fs.readFileSync(globUrl, { encoding: "utf-8" });
  //     const frontmatter = fm(markdown);
  //     markdown = markdown.replace(/^---$.*^---$/ms, "");

  //     const html = marked.parse(frontmatter.body);
  //     const title = kebabCase(frontmatter.attributes.title);
  //     const file = `./dist/${fileName.replace(".html", "")}/${title}.html`;
  //     root
  //       .querySelector("head")
  //       .setAttribute("data-prop-title", frontmatter.attributes.title);
  //     include.innerHTML = html;
  //     root.innerHTML = compileTemplate(root.innerHTML, OUTPUT_FOLDER);

  //     fs.ensureDirSync(path.dirname(file));
  //     fs.writeFileSync(file, root.toString());
  //   });
  // });

  // if (contentIncludes.length === 0) {
  //   fs.writeFileSync(`./dist/${fileName}`, root.toString());
  // }

  fs.writeFileSync(path.join(OUTPUT_FOLDER, fileName), root.toString());
  logger.log("DONE", "green");
}

compile(INPUT_FILE);

export default compile;
