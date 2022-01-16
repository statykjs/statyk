import fs from "fs-extra";
import pathjs from "node:path";
import { getBuildInfo, processBuildConfig } from "../utils/getBuildInfo";
import compile from "./compile";
import buildPagesFolder from "./buildPagesFolder";
import createWatchServer from "../utils/createWatchServer";

class PluginManager {
  /**
   *
   * @param {import("./types").BuildInfo} buildInfo
   */
  constructor(buildInfo) {
    /** @type {import("./types").PluginHook[]} */
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
  async runPlugins(name, data) {
    for (const plugin of this.plugins) {
      if (name.endsWith("Build")) {
        await plugin?.[name]?.(this.buildInfo);
        return;
      }
      await plugin?.[name]?.(data, this.buildInfo);
    }
  }
}

class Statyk {
  constructor() {
    /** @type {import("./types").StatykContext} */
    this.statykCtx = {};
    /** @type {import("./types").PageNode[]} */
    this.pagesToCompile = [];

    this.pluginManager = new PluginManager(this.statykCtx);
  }

  init(options) {
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
  createPage({ path, context, content }) {
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
  createPages(pages) {
    pages.forEach((page) => this.createPage(page));
  }

  /**
   *
   * @param {import("./types").PluginHook} plugin
   */
  use(plugin) {
    this.pluginManager.plugins.push(plugin);
  }

  async build() {
    await this.pluginManager.runPlugins("beforeBuild");

    await compile(this.statykCtx.INPUT_FILE, this.statykCtx);

    for (const page of this.pagesToCompile) {
      await compile(page.path, page.buildInfo, page.content, page.context);
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
