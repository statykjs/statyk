import cache from "memory-cache";

import logger from "../utils/logger";
import { getBuildInfo } from "../utils/getBuildInfo";
import build from "./build";

const watcher = () => {
  const buildInfo = getBuildInfo();

  const isWatching = process.argv.includes("--watch");

  if (!buildInfo.OUTPUT_FOLDER.startsWith("./")) {
    logger.warn("Make sure that output folder starts with ./");
    process.exit(1);
  }

  const task = () => {
    cache.clear();
    build();
  };

  task();

  if (isWatching) {
    runServer(buildInfo, task);
  }
};

watcher();
