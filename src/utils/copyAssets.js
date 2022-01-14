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
    logger.log("Copying Assets", "gray");
    const inputPath = resolvePath(from, buildInfo.STATIC_FOLDER);
    const outputPath = path.join(to, buildInfo.STATIC_FOLDER);

    fs.copySync(inputPath, outputPath);
  } catch (err) {
    if (err.code == "ENOENT") {
      logger.error(`No static folder found`);
    }
  }
}

export default copyAssets;
