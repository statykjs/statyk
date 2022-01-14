import fs from "fs-extra";
import path from "node:path";
import { getBuildInfo } from "./getBuildInfo";
import logger from "./logger";
import resolvePath from "./resolvePath";

/**
 * @param {string} from
 * @param {string} to
 */
function copyAssets(from, to) {
  try {
    const buildInfo = getBuildInfo();
    logger.primarySuccess("Copying Assets");
    const inputPath = resolvePath(from, buildInfo.STATIC_FOLDER);
    const outputPath = path.join(to, buildInfo.STATIC_FOLDER);

    fs.copySync(inputPath, outputPath);
  } catch (err) {
    if (err.code == "ENOENT") {
      logger.error(`No static folder found`);
    }
  }

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
