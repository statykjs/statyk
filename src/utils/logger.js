import chalk from "chalk";

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
 * @param {import('chalk').Color} color
 */
const log = (msg, color) => console.log(chalk[color](msg));

const logger = {
  primarySuccess,
  warn,
  log,
};

export default logger;
