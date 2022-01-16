import fs from "fs-extra";
import pathjs from "node:path";
import { processBuildConfig } from "../utils/getBuildInfo";
import compile from "./compile";
import buildPagesFolder from "./buildPagesFolder";
import createWatchServer from "../utils/createWatchServer";

/**
 * @typedef {{path: string, content: string,context: Record<string, any>}} PageNode
 */

/**
 * @typedef {{
 *  beforeBuild: () => void,
 *  afterBuild: () => void,
 *  beforeCreatePage: () => void,
 *  afterCreatepage: () => void
 * }} Plugin
 */

class Statyk {
  constructor() {
    /** @type {import("../utils/getBuildInfo").BuildInfo} */
    this.buildInfo = {};
    /** @type {Plugin[]} */
    this.plugins = [];
    this.pagesToCompile = [];
  }

  config(options) {
    this.buildInfo = processBuildConfig(options);
    fs.emptyDirSync(this.buildInfo.OUTPUT_FOLDER);
  }

  /**
   * @param {PageNode} node
   */
  createPage({ path, context, content }) {
    this.pagesToCompile.push([
      pathjs.join(this.buildInfo.BASE_FOLDER, path),
      this.buildInfo,
      content,
      context,
    ]);
  }

  /**
   * @param {PageNode[]} pages
   */
  createPages(pages) {
    pages.forEach((page) => this.createPage(page));
  }

  /**
   *
   * @param {Plugin} plugin
   */
  use(plugin) {
    this.plugins.push(plugin);
  }

  async runPlugins(name) {
    for (const plugin of this.plugins) {
      await plugin[name](this.buildInfo, this.pagesToCompile);
    }
  }

  async build() {
    await this.runPlugins("beforeBuild");

    compile(this.buildInfo.INPUT_FILE, this.buildInfo);
    this.pagesToCompile.forEach((page) => compile(...page));
    buildPagesFolder(this.buildInfo);

    await this.runPlugins("afterBuild");
  }

  serve() {
    createWatchServer(this.buildInfo, () => {
      this.pagesToCompile = [];
      this.build();
    });
  }
}

export default Statyk;
