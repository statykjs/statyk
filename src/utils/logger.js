import { default as chalk } from "chalk";

/**
 * @param {string} msg
 */
const primarySuccess = (msg) => console.log(chalk.green(msg));
/**
 * @param {string} msg
 */
const warn = (msg) => console.log(chalk.yellow(msg));
/**
 * @param {string} msg
 */
const error = (msg) => console.error(chalk.red(msg));

/**
 * @param {string} msg
 * @param {import('chalk').Color} color
 */
const log = (msg, color) => console.log(chalk[color](msg));

const logger = {
  primarySuccess,
  warn,
  error,
  log,
};

export default logger;
