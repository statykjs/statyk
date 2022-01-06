import fs, { ensureDirSync } from "fs-extra";
import path from "node:path";
import { parse } from "node-html-parser";
import { cosmiconfigSync } from "cosmiconfig";
import cache from "memory-cache";
// import { marked } from "marked";
// import glob from "glob";
// import fm from "front-matter";
// import { kebabCase } from "lodash-es";

import compileTemplate from "./utils/compileTemplate";
import copyAssets from "./utils/copyAssets";
import logger from "./utils/logger";
import resolvePath from "./utils/resolvePath";
import removeTrailingDots from "./utils/removeTrailingDots";

const explorer = cosmiconfigSync("deadsimple");
const { config } = explorer.load(".deadsimplerc");

const INPUT_FILE = path.resolve(config.input);
const BASE_FOLDER = path.dirname(config.input);
const PAGES_FOLDER = config.pagesFolder;
const OUTPUT_FOLDER = config.out;

fs.emptyDirSync(OUTPUT_FOLDER);

function relinkHyperlinks(root, baseFolder) {
  try {
    // Relink & parse hyperlinked files
    const hyperlinks = root.querySelectorAll('a[href!="#"]');
    hyperlinks.forEach((hyperlink) => {
      const rawUrl = removeTrailingDots(hyperlink.getAttribute("href"));
      const assetUrl = resolvePath(baseFolder, rawUrl);
      if (rawUrl.startsWith("http")) return;

      const pagesRegex = new RegExp(`^\\b${PAGES_FOLDER}\\b`);
      const href = `/${rawUrl.replace(pagesRegex, "").replace("/", "")}`;
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

function writeToPagesFolder(root, filePath) {
  // remove pages folder
  const finalFolder = filePath.replace(PAGES_FOLDER, "");
  ensureDirSync(path.join(OUTPUT_FOLDER, path.dirname(finalFolder)));

  // get all the links with url to remove it's url
  const selector = `a[href=".${finalFolder
    .replace(new RegExp(`\\${path.sep}`, "g"), "/")
    .replace(".html", "")}"]`;
  const aLinks = root.querySelectorAll(selector);
  aLinks.forEach((link) => link.setAttribute("href", "#"));

  fs.writeFileSync(path.join(OUTPUT_FOLDER, finalFolder), root.toString());
}

function compile(inputFile = INPUT_FILE) {
  cache.put(inputFile, true);
  const fileName = path.basename(inputFile);
  const filePath = path.relative(BASE_FOLDER, inputFile);

  try {
    const fileContent = fs.readFileSync(inputFile, { encoding: "utf-8" });
    const root = parse(fileContent);

    copyAssets(BASE_FOLDER, OUTPUT_FOLDER);

    logger.log(`\nCompiling Template ${fileName}`, "magentaBright");
    root.set_content(compileTemplate(root.innerHTML, BASE_FOLDER));

    relinkHyperlinks(root, BASE_FOLDER);

    // write to pages folder
    if (filePath.split(path.sep)[0] === PAGES_FOLDER) {
      writeToPagesFolder(root, filePath);
    } else {
      // write index
      fs.writeFileSync(path.join(OUTPUT_FOLDER, fileName), root.toString());
    }
    logger.log(`DONE - ${fileName}`, "green");
  } catch (err) {
    if (err.code == "ENOENT") {
      logger.error(`No such file: "${filePath}"`);
      process.exit(1);
    }

    console.log(err.message);
  }
}

compile(INPUT_FILE);

export default compile;

// const LIVE_RELOAD_SCRIPT = `
// <script>
//   document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
// </script>
// `;
// root.set_content(`
//   ${root.innerHTML}
//   ${LIVE_RELOAD_SCRIPT}
// `);
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
