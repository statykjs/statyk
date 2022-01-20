import fetch from "node-fetch";
import ts from "typescript";
import { NodeVM } from "vm2";
import logger from "../utils/logger";

const runCode = async (js: string, props: Record<string, any> = {}) => {
  try {
    const vm = new NodeVM({
      compiler: (code) => ts.transpile(code),
      require: {
        external: true,
      },
      sandbox: {
        fetch: fetch,
        props
      }
    });
    const code = `
      module.exports = (async function () {
        ${js}
      })
    `;
    return await vm.run(code)();
  } catch (err) {
    // @ts-ignore
    logger.warn(err);
  }

  return "";
};

export default runCode;
