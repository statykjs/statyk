import { NodeVM } from "vm2";
import logger from "../utils/logger";

/**
 * @param {string} str
 * @returns {boolean}
 */
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
 * @param {Record<string, any>} globalVars
 * @returns {string}
 */
const runExpression = (js, globalVars = {}) => {
  try {
    const vm = new NodeVM({
      require: {
        external: true,
      },
    });

    const stringProps = stringifyObject(globalVars);

    const utils = `
      const map = (arr, cb) => arr.map((i, a) => cb(i, a)).join('\\n');
    `;

    const code = `
      ${utils}
      const props = {
        ${stringProps}
      };

      module.exports = ${js};
    `;
    return vm.run(code);
  } catch (err) {
    logger.warn(err);
  }
};

export default runExpression;
