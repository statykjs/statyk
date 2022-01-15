import path from "node:path";
import shortid from "shortid";
import { snakeCase } from "lodash-es";
import { parse } from "node-html-parser";
import ts from "typescript";

import { stringifyObject } from "./runExpression";
import { coreRuntime } from "./compile";

const HASH_ID_FUNC = "getElementByHashId";

/**
 * @param {string} idName
 * @param {string} sid
 * @param {HTMLScriptElement[]} allIdNames
 */
function processHashElements(idName, sid, allIdNames) {
  const element = allIdNames[idName];
  const newId = `${sid}-${idName}`;
  if (!element) {
    throw new Error(`Cannot find element with hashid: ${idName}`);
  }
  element.setAttribute("id", newId);
  element.removeAttribute("hashid");
}

/**
 * @template {ts.Node} T
 * @param {string} sid
 * @param {HTMLScriptElement[]} allIdNames
 * @returns {ts.TransformerFactory<T>}
 */
function transformGetByHashId(sid, allIdNames) {
  return (context) => {
    /** @type {ts.Visitor} */
    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        if (node.expression.escapedText !== HASH_ID_FUNC) return node;

        const arg = node.arguments[0];
        if (!arg) {
          throw new Error(`${HASH_ID_FUNC} expects 1 argument but got zero`);
        }
        if (!ts.isStringLiteral(arg)) {
          throw new TypeError(`${HASH_ID_FUNC} only accepts string`);
        }
        const idName = arg.text;
        processHashElements(idName, sid, allIdNames);

        return ts.factory.updateCallExpression(
          node,
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("document"),
            "getElementById"
          ),
          [],
          [
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("__id"),
              ts.SyntaxKind.PlusToken,
              ts.factory.createStringLiteral(`-${idName}`)
            ),
          ]
        );
      }
      return ts.visitEachChild(node, (child) => visit(child), context);
    };

    return (node) => ts.visitNode(node, visit);
  };
}

/**
 * Parses script tags and instantiates component instances
 * @param {string} html
 * @param {string} fileName
 * @param {Record<string, any>} props
 * @returns
 */
const instanceComponentScript = (html, fileName, props) => {
  const root = parse(html);
  const stringProps = stringifyObject(props);
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

    // TODO: improve compilerOptions
    const { outputText } = ts.transpileModule(script.textContent, {
      compilerOptions: { allowJs: true },
      transformers: { before: [transformGetByHashId(sid, allIdNames)] },
    });
    script.textContent = outputText;

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
        `${fnName}({ __id: "${sid}", ${stringProps}});`,
      ],
    });

    script.remove();
  });

  return root.innerHTML;
};

export default instanceComponentScript;
