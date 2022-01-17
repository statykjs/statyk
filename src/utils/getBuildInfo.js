// @ts-check
import path from "node:path";
import { cosmiconfigSync } from "cosmiconfig";

/**
 * @param {Record<string, any>} config
 */
function processBuildConfig(config) {
  /** @type {string} */
  const INPUT_FILE = config.input;
  /** @type {string} */
  const BASE_FOLDER = path.dirname(config.input);
  /** @type {string} */
  const OUTPUT_FOLDER = config.out || "dist";
  /** @type {string} */
  const PAGES_FOLDER = config.pagesFolder || "pages";
  /** @type {string} */
  const STATIC_FOLDER = config.staticFolder || "static";

  const buildInfo = {
    INPUT_FILE,
    BASE_FOLDER,
    PAGES_FOLDER,
    OUTPUT_FOLDER,
    STATIC_FOLDER,
  };

  return buildInfo;
}

function getBuildInfo() {
  const explorer = cosmiconfigSync("statyk");
  const { config } = explorer.load(".statykrc");

  return processBuildConfig(config);
}

/**
 * @typedef {ReturnType<getBuildInfo>} BuildInfo
 */

export { getBuildInfo, processBuildConfig };
