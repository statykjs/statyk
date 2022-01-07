/**
 * @see https://github.com/sindresorhus/slash
 * @param {string} path
 * @returns {string}
 */
const normalizePath = (path) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  return path.replace(/\\/g, "/");
};

export default normalizePath;