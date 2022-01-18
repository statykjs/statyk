import logger from "../utils/logger";
import Statyk from "../core/statyk";

const watcher = () => {
  const statyk = new Statyk();
  statyk.init();

  const buildInfo = statyk.statykCtx;

  if (!buildInfo.OUTPUT_FOLDER.startsWith("./")) {
    logger.warn("Make sure that output folder starts with ./");
    process.exit(1);
  }

  statyk.serve();
};

if (process.argv.includes("--run")) {
  watcher();
}

export default watcher;
