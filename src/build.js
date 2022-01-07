import fs, { ensureDirSync } from "fs-extra";
import path from "node:path";
import { parse } from "node-html-parser";
import { cosmiconfigSync } from "cosmiconfig";
import cache from "memory-cache";

import compileTemplate from "./utils/compileTemplate";
import copyAssets from "./utils/copyAssets";
import logger from "./utils/logger";
import resolvePath from "./utils/resolvePath";
import injectLiveReloadScript from "./utils/injectLiveReloadScript";
import writeToOutput from "./utils/writeToOutput";

// import { marked } from "marked";
// import glob from "glob";
// import fm from "front-matter";
// import { kebabCase } from "lodash-es";

const explorer = cosmiconfigSync("deadsimple");
const { config } = explorer.load(".deadsimplerc");

const INPUT_FILE = path.resolve(config.input);
const BASE_FOLDER = path.dirname(config.input);
const PAGES_FOLDER = config.pagesFolder || "pages";
const OUTPUT_FOLDER = config.out || "dist";
const STATIC_FOLDER = config.staticFolder || "static";

export const buildConfig = {
  INPUT_FILE,
  BASE_FOLDER,
  PAGES_FOLDER,
  OUTPUT_FOLDER,
  STATIC_FOLDER,
};

fs.emptyDirSync(buildConfig.OUTPUT_FOLDER);
export const PAGES_REGEX = new RegExp(`^\\b${buildConfig.PAGES_FOLDER}\\b`);

function relinkHyperlinks(root, baseFolder) {
  try {
    // Relink & parse hyperlinked files
    const hyperlinks = root.querySelectorAll('a[href!="#"]');
    hyperlinks.forEach((hyperlink) => {
      const rawUrl = hyperlink.getAttribute("href");
      const assetUrl = resolvePath(baseFolder, rawUrl);
      if (rawUrl.startsWith("http")) return;

      const href = `/${rawUrl.replace(PAGES_REGEX, "").replace("/", "")}`;
      hyperlink.setAttribute("href", href);

      // Fix css newline classes
      // (only related to tailwind classes where classes are newline separated)
      if (hyperlink.attributes.class) {
        hyperlink.setAttribute(
          "class",
          hyperlink.attributes.class.replace(/\s+/gim, " ")
        );
      }

      if (!cache.get(assetUrl)) {
        compile(assetUrl);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

function compile(inputFile = buildConfig.INPUT_FILE) {
  cache.put(inputFile, true);
  const fileName = path.basename(inputFile);
  const filePath = path.relative(buildConfig.BASE_FOLDER, inputFile);

  try {
    const fileContent = fs.readFileSync(inputFile, { encoding: "utf-8" });
    const root = parse(fileContent);

    copyAssets(buildConfig.BASE_FOLDER, buildConfig.OUTPUT_FOLDER);

    logger.log(`\nCompiling Template ${fileName}`, "magentaBright");
    root.set_content(compileTemplate(root.innerHTML, buildConfig.BASE_FOLDER));

    relinkHyperlinks(root, buildConfig.BASE_FOLDER);

    injectLiveReloadScript(root);
    writeToOutput(root, filePath);

    logger.log(`DONE - ${fileName}`, "green");
  } catch (err) {
    // if (err.code == "ENOENT") {
    //   logger.error(`No such file: "${filePath}"`);
    //   process.exit(1);
    // }

    console.log(err);
  }
}

compile(INPUT_FILE);

export default compile;

// const contentIncludes = root.querySelectorAll("[data-include-content]");

// contentIncludes.forEach((include) => {
//   const url = include.getAttribute("data-include-content");
//   const globUrls = glob.sync(resolvePath(buildConfig.OUTPUT_FOLDER, url));

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
//     root.innerHTML = compileTemplate(root.innerHTML, buildConfig.OUTPUT_FOLDER);

//     fs.ensureDirSync(path.dirname(file));
//     fs.writeFileSync(file, root.toString());
//   });
// });

// if (contentIncludes.length === 0) {
//   fs.writeFileSync(`./dist/${fileName}`, root.toString());
// }
