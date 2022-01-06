import path from "node:path";

/**
 * @param {string} baseFolder
 * @param {string} url
 * @returns {string}
 */
const resolvePath = (baseFolder, url) => {
  return path.resolve(process.cwd(), baseFolder, ...url.split(path.sep));
};
export default resolvePath;
