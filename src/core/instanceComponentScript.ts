import path from "node:path";
import shortid from "shortid";
import snakeCase from "lodash/snakeCase";
import { HTMLElement, parse } from "node-html-parser";
import ts from "typescript";

import { stringifyObject } from "./runExpression";
import { coreRuntime } from "./compile";

const HASH_ID_FUNC = "getElementByHashId";

function processHashElements(
  idName: string,
  sid: string,
  allIdNames: Record<string, HTMLElement>
) {
  const element = allIdNames[idName];
  const newId = `${sid}-${idName}`;
  if (!element) {
    throw new Error(`Cannot find element with hashid: ${idName}`);
  }
  element.setAttribute("id", newId);
  element.removeAttribute("hashid");
}

function transformGetByHashId<T extends ts.Node>(
  sid: string,
  allIdNames: Record<string, HTMLElement>
): ts.TransformerFactory<T> {
  return (context: ts.TransformationContext) => {
    /** @type {ts.Visitor} */
    const visit: ts.Visitor = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        // @ts-ignore
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

    return (node: any) => ts.visitNode(node, visit);
  };
}

/**
 * Parses script tags and instantiates component instances
 */
const instanceComponentScript = (
  html: string,
  fileName: string,
  props: Record<string, any>
) => {
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

    /** @type {Record<string, HTMLElement>} */
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
      ...scriptCache!,
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
