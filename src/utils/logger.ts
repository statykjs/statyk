import { default as chalk, Color } from "chalk";

/**
 * @param {string} msg
 */
const primarySuccess = (msg: string) => console.log(chalk.green(msg));
/**
 * @param {string} msg
 */
const warn = (msg: string) => console.log(chalk.yellow(msg));
/**
 * @param {string} msg
 */
const error = (msg: string) => console.error(chalk.red(msg));


const log = (msg: string, color: typeof Color) => console.log(chalk[color](msg));

const logger = {
  primarySuccess,
  warn,
  error,
  log,
};

export default logger;
