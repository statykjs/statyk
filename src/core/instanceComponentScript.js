import { parse } from "node-html-parser";
import path from "node:path";
import regexMatchAll from "../utils/regexMatchAll";
import shortid from "shortid";
import { stringifyObject } from "./runExpression";
import { snakeCase } from "lodash-es";

export const scriptCache = {};
const GET_ELEMENT_REGEX = /getElementByHashId\("(.*)"\)/gm;

/**
 * @param {string} content
 * @param {id} id
 * @returns
 */
const convertGetElementByHashId = (content, id) => {
  return content.replace(
    `getElementByHashId("${id}")`,
    `document.getElementById(__id + "-${id}")`
  );
};

const instanceComponentScript = (html, fileName, props) => {
  const root = parse(html);
  const p = stringifyObject(props);
  const componentName = path
    .basename(fileName)
    .replace(path.extname(fileName), "");

  const scripts = root.querySelectorAll("script");

  scripts.forEach((script) => {
    if (script?.getAttribute("src")?.startsWith("http")) return;
    const sid = shortid.generate();
    const elementIds = root.querySelectorAll("[hashid]");

    const allIdNames = elementIds.reduce((prev, curr) => {
      return { ...prev, [curr.attributes.hashid]: curr };
    }, {});

    regexMatchAll(GET_ELEMENT_REGEX, script.textContent, (match) => {
      const idName = match[1];
      const element = allIdNames[idName];
      if (!element) throw new Error("Nope");

      const newId = `${sid}-${idName}`;
      element.setAttribute("id", newId);
      element.removeAttribute("hashid");

      script.textContent = convertGetElementByHashId(
        script.textContent,
        idName
      );
    });

    const fnName = snakeCase(componentName);
    script.textContent = `
      function ${fnName}(props) {
        const __id = props.__id;
        ${script.textContent}
      };
    `;

    scriptCache[fnName] = {
      ...scriptCache[fnName],
      el: script,
      content: script.textContent,
      instances: [
        ...(scriptCache[fnName]?.instances || []),
        `${fnName}({
          __id: "${sid}", ${p}
        });`,
      ],
    };

    script.remove();
  });

  return root.innerHTML;
};

export default instanceComponentScript;
