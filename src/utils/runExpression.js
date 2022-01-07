import { NodeVM } from "vm2";
import logger from "./logger";

const isArrayStr = (str) => {
  try {
    const v = JSON.parse(str);
    if (Array.isArray(v)) return true;
    return false;
  } catch (err) {
    return false;
  }
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

    const p = Object.keys(globalVars)
      .filter((key) => key !== "src")
      .map((v) => {
        return `${v}: ${
          isArrayStr(globalVars[v])
            ? globalVars[v]
            : `"${globalVars[v].replace(/"/g, "")}"`
        },`;
      })
      .join("\n");

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
