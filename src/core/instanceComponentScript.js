import path from "node:path";
import shortid from "shortid";
import { snakeCase } from "lodash-es";
import { parse } from "node-html-parser";

import regexMatchAll from "../utils/regexMatchAll";
import { stringifyObject } from "./runExpression";
import { coreRuntime } from "./compile";

const GET_ELEMENT_REGEX = /getElementByHashId\("(.*)"\)/gm;

/**
 * @param {string} content
 * @param {id} id
 * @returns {string}
 */
const convertGetElementByHashId = (content, id) => {
  return content.replace(
    `getElementByHashId("${id}")`,
    `document.getElementById(__id + "-${id}")`
  );
};

/**
 * Parses script tags and instantiates component instances
 * @param {string} html
 * @param {string} fileName
 * @param {Record<string, any>} props
 * @returns
 */
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

    const scriptCache = coreRuntime.caches.scripts.get(fnName);
    coreRuntime.caches.scripts.put(fnName, {
      ...scriptCache,
      el: script,
      content: script.textContent,
      instances: [
        ...(scriptCache?.instances || []),
        `${fnName}({ __id: "${sid}", ${p}});`,
      ],
    });

    script.remove();
  });

  return root.innerHTML;
};

export default instanceComponentScript;
