// @ts-check
import fs from "fs-extra";
import path from "node:path";
import logger from "./logger";
import resolvePath from "./resolvePath";

/**
 * @param {string} from
 * @param {string} to
 * @param {import("../core/types").StatykContext} statykCtx
 */
function copyAssets(from, to, statykCtx) {
  try {
    logger.log("Copying Assets", "gray");
    const inputPath = resolvePath(from, statykCtx.STATIC_FOLDER);
    const outputPath = path.join(to, statykCtx.STATIC_FOLDER);

    fs.copySync(inputPath, outputPath);
  } catch (err) {
    if (err.code == "ENOENT") {
      logger.error(`No static folder found`);
    }
  }
}

export default copyAssets;
