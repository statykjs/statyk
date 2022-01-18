// @ts-check
import fs from "fs-extra";
import path from "node:path";
import { StatykContext } from "../core/types";
import logger from "./logger";
import resolvePath from "./resolvePath";

function copyAssets(from: string, to: string, statykCtx: StatykContext) {
  try {
    logger.log("Copying Assets", "gray");
    const inputPath = resolvePath(from, statykCtx.STATIC_FOLDER);
    const outputPath = path.join(to, statykCtx.STATIC_FOLDER);

    fs.copySync(inputPath, outputPath);
  } catch (err) {
    // @ts-ignore
    if (err.code == "ENOENT") {
      logger.error(`No static folder found`);
    }
  }
}

export default copyAssets;
