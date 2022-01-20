//
// FORKED FROM https://github.com/jxson/front-matter/blob/master/index.js
// Should not need regular changes in this file
//
const optionalByteOrderMark = "\\ufeff?";
const platform = typeof process !== "undefined" ? process.platform : "";
const pattern =
  "^(" +
  optionalByteOrderMark +
  "(= yaml =|---)(yml)?" +
  "$([\\s\\S]*?)" +
  "^(?:\\2|\\.\\.\\.)\\s*" +
  "$" +
  (platform === "win32" ? "\\r?" : "") +
  "(?:\\n)?)";

// NOTE: If this pattern uses the 'g' flag the `regex` variable definition will
// need to be moved down into the functions that use it.
const regex = new RegExp(pattern, "m");

function extractor(string: string = "") {
  const lines = string.split(/(\r?\n)/);

  if (lines[0] && /= yaml =|---/.test(lines[0])) {
    return parse(string);
  } else {
    return {
      body: string,
      bodyBegin: true,
    };
  }
}

function parse(string: string) {
  const match = regex.exec(string);
  if (!match) {
    return {
      body: string,
      bodyBegin: true,
    };
  }

  const isYml = !!match[3];
  const frontmatter = match[match.length - 1].replace(/^\s+|\s+$/g, "");
  const body = string.replace(match[0], "");

  return {
    isYml,
    body,
    frontmatter,
    bodyBegin: false,
  };
}

export default extractor;
