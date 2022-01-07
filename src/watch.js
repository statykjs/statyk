import module from "module";
import path from "node:path";
import cache from "memory-cache";
import livereload from "livereload";

import logger from "./utils/logger";
import removeTrailingDots from "./utils/removeTrailingDots";
import compile, { buildConfig } from "./build";

const require = module.createRequire(import.meta.url);

const isWatching = process.argv.includes("--watch");

const watcher = () => {
  if (!buildConfig.OUTPUT_FOLDER.startsWith("./")) {
    logger.warn("Make sure that output folder starts with ./");
    process.exit(1);
  }

  const task = () => {
    cache.clear();
    compile(buildConfig.INPUT_FILE);
  };

  task();

  if (isWatching) {
    const chokidar = require("chokidar");
    const connect = require("connect");
    const serveStatic = require("serve-static");

    const removeTrailingSlash = (path) => path.replace(/\/$/, "");
    const watchRoot = removeTrailingSlash(buildConfig.BASE_FOLDER);
    const ignored = removeTrailingDots(
      removeTrailingSlash(buildConfig.OUTPUT_FOLDER)
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
      .use(serveStatic(buildConfig.OUTPUT_FOLDER))
      .listen(PORT, function () {
        console.log(`Live server running on http://localhost:${PORT}`);
      });

    const lrserver = livereload.createServer();
    lrserver.watch(path.join(process.cwd(), buildConfig.OUTPUT_FOLDER));
  }
};

watcher();
