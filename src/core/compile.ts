import fs from "fs-extra";
import path from "node:path";
import { Cache } from "memory-cache";
import { HTMLElement, parse } from "node-html-parser";

import logger from "../utils/logger";
import copyAssets from "../utils/copyAssets";
import relinkHyperlinks from "./relinkHyperlinks";
import writeToOutput from "../utils/writeToOutput";
import compileTemplate, { stack } from "./compileTemplate";
import injectLiveReloadScript from "../utils/injectLiveReloadScript";
import { parseMarkdown } from "./buildPagesFolder";
import { PluginPageNode, StatykContext } from "./types";

export const coreRuntime = {
  caches: {
    compilation: new Cache<string, boolean>(),
    scripts: new Cache<
      string,
      {
        el: HTMLElement | null;
        content: string;
        appended: boolean;
        instances: string[];
      }
    >(),
  },
  isFirstCompileRun: true,
};

export async function compile(
  input: string,
  statykCtx: StatykContext,
  content?: string,
  context: Record<string, any> = {}
) {
  const inputFile = path.resolve(input || statykCtx.INPUT_FILE);
  const fileName = path.basename(inputFile);
  const filePath = path.relative(statykCtx.BASE_FOLDER, inputFile);
  const isMarkdown = filePath.endsWith(".md");

  coreRuntime.caches.compilation.put(inputFile, true);

  try {
    let fileContent =
      content ?? fs.readFileSync(inputFile, { encoding: "utf-8" });

    if (isMarkdown) {
      fileContent = parseMarkdown(fileContent);
    }
    const root = parse(fileContent);

    logger.log(`>> Compiling Template ${fileName}`, "magentaBright");
    const compiledContent = await compileTemplate(
      root.innerHTML,
      statykCtx.BASE_FOLDER,
      context
    );
    root.set_content(compiledContent!);

    if (coreRuntime.isFirstCompileRun) {
      copyAssets(statykCtx.BASE_FOLDER, statykCtx.OUTPUT_FOLDER, statykCtx);
    }
    relinkHyperlinks(root, statykCtx);
    injectLiveReloadScript(root);

    const pageNode: PluginPageNode = {
      root,
      path: filePath,
      content: fileContent,
      frontmatter: {},
      isMarkdown,
      fileName,
      inputFile,
      isCached: !!coreRuntime.caches.compilation.get(inputFile),
      context: context,
    };

    await statykCtx.pluginManager.runPlugins("beforeCreatePage", pageNode);

    writeToOutput(pageNode.root, pageNode.path, statykCtx);

    coreRuntime.caches.scripts.clear(); // remove script cache
    
    await statykCtx.pluginManager.runPlugins("afterCreatePage", pageNode);

    logger.log(`DONE - ${fileName}`, "gray");
  } catch (err) {
    console.log(err);
  }

  coreRuntime.isFirstCompileRun = false;
}
