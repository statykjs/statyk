import { NodeVM } from "vm2";
import logger from "./logger";

export const isArrayStr = (str) => {
  try {
    const v = JSON.parse(str);
    if (Array.isArray(v)) return true;
    return false;
  } catch (err) {
    return false;
  }
};

/**
 * @param {Record<string, any>} obj
 * @returns  {string}
 */
export const stringifyObject = (obj) => {
  return Object.keys(obj)
    .filter((key) => key !== "src")
    .map((key) => {
      const val = isArrayStr(obj[key])
        ? obj[key]
        : `"${obj[key].replace(/"/g, "")}"`;
      return `${key}: ${val},`;
    })
    .join("\n");
};

/**
 * @param {string} js
 * @returns {string}
 */
const runExpression = (js, globalVars = {}) => {
  try {
    const vm = new NodeVM({
      require: {
        external: true,
      },
    });

    const p = stringifyObject(globalVars);

    const utils = `
      const map = (arr, cb) => arr.map((i, a) => cb(i, a)).join('\\n');
    `;

    const props = `
      ${utils}
      const props = {
        ${p}
      };
    `;

    const code = `
      ${props}
      module.exports = ${js};
    `;
    return vm.run(code);
  } catch (err) {
    logger.warn(err);
  }
};

export default runExpression;
