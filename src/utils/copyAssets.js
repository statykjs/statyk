import fs from "fs-extra";
import path from "node:path";
import { buildConfig } from "../build";
import logger from "./logger";
import resolvePath from "./resolvePath";

/**
 * @param {string} from
 * @param {string} to
 */
function copyAssets(from, to) {
  logger.primarySuccess("Copying Assets");
  const inputPath = resolvePath(from, buildConfig.STATIC_FOLDER);
  const outputPath = path.join(to, buildConfig.STATIC_FOLDER);

  fs.copySync(inputPath, outputPath);

  // assets.forEach((asset) => {
  //   const assetType = ["LINK"].includes(asset.tagName) ? "href" : "src";
  //   const rawUrl = asset.attributes[assetType].replace(/^(?:\.\.\/)+/, "");
  //   if (rawUrl.startsWith("http") || rawUrl.startsWith("#")) {
  //     return;
  //   }
  //   const assetUrl = resolvePath(baseFolder, rawUrl);
  //   const outputUrl = path.join("dist", rawUrl);
  //   const outputFolder = path.dirname(outputUrl);
  //   try {
  //     if (!fs.existsSync(outputFolder)) {
  //       logger.warn(" - Folder does not exists " + outputFolder);
  //       mkdirRecursive(outputFolder);
  //     }

  //     fs.copyFileSync(assetUrl, outputUrl);

  //     asset.setAttribute(assetType, `./${rawUrl}`);
  //   } catch (err) {
  //     throw err;
  //   }
  // });
}

export default copyAssets;
