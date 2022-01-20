import { HTMLElement } from "node-html-parser";
import { getBuildInfo } from "../../utils/getBuildInfo";
import { PluginManager } from "../statyk";

export type PageNode = {
  path: string;
  content: string;
  context: Record<string, any>;
  buildInfo: BuildInfo;
};

export type BuildInfo = ReturnType<typeof getBuildInfo>;

export type PluginPageNode = {
  path: string;
  isMarkdown: boolean;
  fileName: string;
  inputFile: string;
  isCached: boolean;
  content: string;
  root: HTMLElement;
  context: Record<string, any>;
  frontmatter: any;
};

export type PluginHook = {
  beforeBuild: (buildInfo: BuildInfo) => Promise<void>;
  afterBuild: (buildInfo: BuildInfo) => Promise<void>;
  beforeCreatePage: (
    node: PluginPageNode,
    buildInfo: BuildInfo
  ) => Promise<void>;
  afterCreatePage: (
    node: PluginPageNode,
    buildInfo: BuildInfo
  ) => Promise<void>;
};

export type StatykPlugin = (opts: any) => PluginHook;

export type PluginHookNames = keyof PluginHook;

export type StatykContext = BuildInfo & { pluginManager: PluginManager };

export type StatykConfig = {
  input: string;
  out: string;
  pagesFolder: string;
  staticFolder: string;
};
