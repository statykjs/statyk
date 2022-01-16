import path from "node:path";
import livereload from "livereload";
import removeTrailingDots from "../utils/removeTrailingDots";
import { Stats } from "node:fs";
import module from "module";

const require = module.createRequire(import.meta.url);
const chokidar = require("chokidar");
const connect = require("connect");
const serveStatic = require("serve-static");

/**
 * @param {import("../core/types").StatykContext} statykCtx
 * @param {(path: string, stats?: Stats) => void} task
 */
function createWatchServer(statykCtx, task) {
  const removeTrailingSlash = (path) => path.replace(/\/$/, "");
  const watchRoot = removeTrailingSlash(statykCtx.BASE_FOLDER);
  const ignored = removeTrailingDots(
    removeTrailingSlash(statykCtx.OUTPUT_FOLDER)
  );

  task();
  const watcher = chokidar.watch(watchRoot, {
    ignored,
    ignoreInitial: true,
  });
  watcher.on("change", task);
  watcher.on("add", task);
  watcher.on("unlink", task);

  const PORT = 4000;
  connect()
    .use(serveStatic(statykCtx.OUTPUT_FOLDER))
    .listen(PORT, function () {
      console.log(`[statyk]: Server running on http://localhost:${PORT}`);
    });

  const lrserver = livereload.createServer();
  lrserver.watch(path.join(process.cwd(), statykCtx.OUTPUT_FOLDER));
}

export default createWatchServer;
