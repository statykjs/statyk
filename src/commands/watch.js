import module from "module";
import path from "node:path";
import cache from "memory-cache";
import livereload from "livereload";

import logger from "../utils/logger";
import removeTrailingDots from "../utils/removeTrailingDots";
import { getBuildInfo } from "../utils/getBuildInfo";
import build from "./build";

const require = module.createRequire(import.meta.url);

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
    const chokidar = require("chokidar");
    const connect = require("connect");
    const serveStatic = require("serve-static");

    const removeTrailingSlash = (path) => path.replace(/\/$/, "");
    const watchRoot = removeTrailingSlash(buildInfo.BASE_FOLDER);
    const ignored = removeTrailingDots(
      removeTrailingSlash(buildInfo.OUTPUT_FOLDER)
    );

    const watcher = chokidar.watch(watchRoot, {
      ignored,
      ignoreInitial: true,
    });
    watcher.on("change", task);
    watcher.on("add", task);
    watcher.on("unlink", task);

    const PORT = 4000;
    connect()
      .use(serveStatic(buildInfo.OUTPUT_FOLDER))
      .listen(PORT, function () {
        console.log(`[statyk]: Server running on http://localhost:${PORT}`);
      });

    const lrserver = livereload.createServer();
    lrserver.watch(path.join(process.cwd(), buildInfo.OUTPUT_FOLDER));
  }
};

watcher();
