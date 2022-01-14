import fs from "fs-extra";
import path from "node:path";
import cache from "memory-cache";
import { parse } from "node-html-parser";

import compileTemplate from "../core/compileTemplate";
import copyAssets from "../utils/copyAssets";
import logger from "../utils/logger";
import injectLiveReloadScript from "../utils/injectLiveReloadScript";
import writeToOutput from "../utils/writeToOutput";
import { scriptCache } from "../core/instanceComponentScript";
import relinkHyperlinks from "./relinkHyperlinks";

/**
 *
 * @param {import("../utils/getBuildInfo").BuildInfo} buildInfo
 * @param {*} htmlContent
 */
function compile(input, buildInfo, htmlContent) {
  const inputFile = input || buildInfo.INPUT_FILE;

  cache.put(inputFile, true);
  const fileName = path.basename(inputFile);
  const filePath = path.relative(buildInfo.BASE_FOLDER, inputFile);

  try {
    const fileContent = htmlContent
      ? htmlContent
      : fs.readFileSync(inputFile, { encoding: "utf-8" });
    const root = parse(fileContent);

    logger.log(`\nCompiling Template ${fileName}`, "magentaBright");
    root.set_content(compileTemplate(root.innerHTML, buildInfo.BASE_FOLDER));

    copyAssets(buildInfo.BASE_FOLDER, buildInfo.OUTPUT_FOLDER);
    relinkHyperlinks(root, buildInfo.BASE_FOLDER, buildInfo.PAGES_FOLDER);

    injectLiveReloadScript(root);
    writeToOutput(root, filePath, buildInfo);

    // remove script cache
    Object.keys(scriptCache).forEach((key) => {
      delete scriptCache[key];
    });
    logger.log(`DONE - ${fileName}`, "gray");
  } catch (err) {
    // if (err.code == "ENOENT") {
    //   logger.error(`No such file: "${filePath}"`);
    //   process.exit(1);
    // }

    console.log(err);
  }
}

export default compile;
