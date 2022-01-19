import path from "node:path";
import { cosmiconfigSync } from "cosmiconfig";
import { Config } from "cosmiconfig/dist/types";

function processBuildConfig(config: Config) {
  const INPUT_FILE: string = config.input;
  const BASE_FOLDER: string = path.dirname(config.input);
  const OUTPUT_FOLDER: string = config.out || "dist";
  const PAGES_FOLDER: string = config.pagesFolder || "pages";
  const STATIC_FOLDER: string = config.staticFolder || "static";

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
  const result = explorer.load(".statykrc");

  return processBuildConfig(result!.config);
}

export type BuildInfo = ReturnType<typeof getBuildInfo>

export { getBuildInfo, processBuildConfig };
