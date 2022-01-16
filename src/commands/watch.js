import logger from "../utils/logger";
import Statyk from "../core/statyk";

const watcher = () => {
  const statyk = new Statyk();
  statyk.init();

  const buildInfo = statyk.statykCtx;
  const isWatching = process.argv.includes("--watch");

  if (!buildInfo.OUTPUT_FOLDER.startsWith("./")) {
    logger.warn("Make sure that output folder starts with ./");
    process.exit(1);
  }

  if (isWatching) {
    statyk.serve();
  }
};

watcher();
