//
// FORKED FROM https://github.com/jxson/front-matter/blob/master/index.js
// Should not need regular changes in this file
//
import parser from "js-yaml";

const optionalByteOrderMark = "\\ufeff?";
const platform = typeof process !== "undefined" ? process.platform : "";
const pattern =
  "^(" +
  optionalByteOrderMark +
  "(= yaml =|---)" +
  "$([\\s\\S]*?)" +
  "^(?:\\2|\\.\\.\\.)\\s*" +
  "$" +
  (platform === "win32" ? "\\r?" : "") +
  "(?:\\n)?)";
// NOTE: If this pattern uses the 'g' flag the `regex` variable definition will
// need to be moved down into the functions that use it.
const regex = new RegExp(pattern, "m");

function extractor(string: string = "") {
  let lines = string.split(/(\r?\n)/);

  if (lines[0] && /= yaml =|---/.test(lines[0])) {
    return parse(string);
  } else {
    return {
      attributes: {},
      body: string,
      bodyBegin: 1,
    };
  }
}

function parse(string: string) {
  let match = regex.exec(string);
  if (!match) {
    return {
      attributes: {},
      body: string,
      bodyBegin: 1,
    };
  }

  let loader = parser.load;
  let yaml = match[match.length - 1].replace(/^\s+|\s+$/g, "");
  let attributes = {};
  let body = string.replace(match[0], "");
  try {
    attributes = loader(yaml) || {};
  } catch {}

  return {
    attributes,
    body,
    frontmatter: yaml,
  };
}

export default extractor;
