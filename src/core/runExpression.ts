import { NodeVM } from "vm2";
import logger from "../utils/logger";

export const isArrayStr = (str: string): boolean => {
  try {
    const v = JSON.parse(str);
    if (Array.isArray(v)) return true;
    return false;
  } catch (err) {
    return false;
  }
};

export const stringifyObject = (obj: Record<string, any>): string => {
  return Object.keys(obj)
    .filter((key) => key !== "src")
    .map((key) => {
      const val = isArrayStr(obj[key])
        ? obj[key]
        : `"${`${obj[key]}`.replace(/"/g, "")}"`;
      return `${key}: ${val},`;
    })
    .join("\n");
};

const runExpression = (
  js: string,
  props: Record<string, any> = {},
  globalVars: Record<string, any> = {}
): string => {
  try {
    const sandbox = {
      props,
      ...globalVars,
    };

    const vm = new NodeVM({
      require: {
        external: true,
      },
      sandbox,
    });

    const utils = `
      const map = (arr, cb) => arr.map((i, a) => cb(i, a)).join('\\n');
    `;
    
    const code = `
      ${utils}
      module.exports = ${js};
    `;
    return vm.run(code);
  } catch (err) {
    // @ts-ignore
    logger.warn(err);
  }

  return "";
};

export default runExpression;
