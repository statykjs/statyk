import path from "node:path";
import { cosmiconfigSync } from "cosmiconfig";

function getBuildInfo() {
  const explorer = cosmiconfigSync("deadsimple");
  const { config } = explorer.load(".deadsimplerc");

  const INPUT_FILE = config.input;
  const BASE_FOLDER = path.dirname(config.input);
  const OUTPUT_FOLDER = config.out || "dist";
  const PAGES_FOLDER = config.pagesFolder || "pages";
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

/**
 * @typedef {ReturnType<getBuildInfo>} BuildInfo
 */

export { getBuildInfo };
