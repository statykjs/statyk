import { HTMLElement } from "node-html-parser";

const injectLiveReloadScript = (root: HTMLElement) => {
  const LIVE_RELOAD_SCRIPT = `
  <script>
    document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
  </script>
  `;
  root.set_content(`
    ${root.innerHTML}
    ${LIVE_RELOAD_SCRIPT}
  `);
};

export default injectLiveReloadScript;
