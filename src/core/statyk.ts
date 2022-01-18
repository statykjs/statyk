import fs from "fs-extra";
import pathjs from "node:path";
import merge from "lodash/merge";

import {
  BuildInfo,
  getBuildInfo,
  processBuildConfig,
} from "../utils/getBuildInfo";
import { compile } from "./compile";
import buildPagesFolder from "./buildPagesFolder";
import createWatchServer from "../utils/createWatchServer";
import type {
  PageNode,
  PluginHook,
  PluginHookNames,
  PluginPageNode,
  StatykConfig,
  StatykContext,
} from "./types";

export class PluginManager {
  plugins: PluginHook[];
  pluginHooks: string[];
  buildInfo: BuildInfo;

  constructor(buildInfo: BuildInfo) {
    this.plugins = [];

    this.pluginHooks = [
      "beforeBuild",
      "afterBuild",
      "beforeCreatePage",
      "afterCreatePage",
      "beforeStaticCopy",
      "afterStaticCopy",
    ];

    this.buildInfo = buildInfo;
  }

  /**
   * @template T
   * @param {import("./types").PluginHookNames} name
   * @param {T=} data
   */
  async runPlugins<T extends PluginPageNode & BuildInfo>(
    name: PluginHookNames,
    data?: T
  ) {
    for (const plugin of this.plugins) {
      if (name.endsWith("Build")) {
        // @ts-ignore
        await plugin?.[name]?.(this.buildInfo);
        return;
      }
      await plugin?.[name]?.(data!, this.buildInfo);
    }
  }
}

class Statyk {
  statykCtx: StatykContext;
  pagesToCompile: PageNode[];
  pluginManager: PluginManager;
  constructor() {
    // @ts-ignore
    this.statykCtx = {};
    this.pagesToCompile = [];

    this.pluginManager = new PluginManager(this.statykCtx);
  }

  init(options: StatykConfig) {
    const buildInfo = !options ? getBuildInfo() : processBuildConfig(options);
    this.pluginManager.buildInfo = buildInfo;
    this.statykCtx = {
      ...buildInfo,
      pluginManager: this.pluginManager,
    };
    fs.emptyDirSync(this.statykCtx.OUTPUT_FOLDER);
  }

  /**
   * @param {import("./types").PageNode} node
   */
  createPage({ path, context, content }: import("./types").PageNode) {
    this.pagesToCompile.push({
      path: pathjs.join(this.statykCtx.BASE_FOLDER, path),
      buildInfo: this.statykCtx,
      content,
      context,
    });
  }

  /**
   * @param {import("./types").PageNode[]} pages
   */
  createPages(pages: import("./types").PageNode[]) {
    pages.forEach((page) => this.createPage(page));
  }

  /**
   *
   * @param {import("./types").PluginHook} plugin
   */
  use(plugin: import("./types").PluginHook) {
    this.pluginManager.plugins.push(plugin);
  }

  async build() {
    await this.pluginManager.runPlugins("beforeBuild");

    await compile(this.statykCtx.INPUT_FILE, this.statykCtx);

    for (const page of this.pagesToCompile) {
      const pageStatykCtx = merge(page.buildInfo, this.statykCtx);
      await compile(page.path, pageStatykCtx, page.content, page.context);
    }
    buildPagesFolder(this.statykCtx);

    await this.pluginManager.runPlugins("afterBuild");
  }

  serve() {
    createWatchServer(this.statykCtx, () => {
      this.pagesToCompile = [];
      this.build();
    });
  }
}

export default Statyk;
