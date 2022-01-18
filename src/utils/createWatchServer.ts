import path from "node:path";
import livereload from "livereload";
import removeTrailingDots from "./removeTrailingDots";
import { Stats } from "node:fs";

import chokidar from "chokidar";
import connect from "connect";
import serveStatic from "serve-static";
import { StatykContext } from "../core/types";

type Task = (path?: string, stats?: Stats) => void;
function createWatchServer(statykCtx: StatykContext, task: Task) {
  const removeTrailingSlash = (path: string) => path.replace(/\/$/, "");
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
