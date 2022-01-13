import { parse } from "node-html-parser";
import path from "node:path";
import regexMatchAll from "./regexMatchAll";
import shortid from "shortid";
import { stringifyObject } from "./runExpression";

export const scriptCache = {};
const GET_ELEMENT_REGEX = /getElementByHashId\("(.*)"\)/gm;

const instanceComponentScript = (html, fileName, props) => {
  const root = parse(html);
  const p = stringifyObject(props);
  const componentName = path
    .basename(fileName)
    .replace(path.extname(fileName), "");

  const scripts = root.querySelectorAll("script");

  scripts.forEach((script) => {
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

      script.textContent = script.textContent.replace(
        `getElementByHashId("${idName}")`,
        `document.getElementById(__id + "-${idName}")`
      );
    });

    const fnName = componentName;
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
