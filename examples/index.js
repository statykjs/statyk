const Statyk = require("statyk").default;

const statyk = new Statyk();

statyk.init({
  out: "./out",
  input: "./simple/index.html",
  pagesFolder: "pages",
});

function statykPlugin() {
  return {
    beforeBuild: () => {
      console.log("Build start");
    },
    afterBuild: () => {
      console.log("Build done");
    },
    beforeCreatePage: async (node, buildInfo) => {
      console.log(`beforeCreatePage for ${node.fileName}`);
    },
    afterCreatePage: async (node, buildInfo) => {
      console.log(`afterCreatePage for ${node.fileName}`);
    },
    beforeStaticCopy() {},
    afterStaticCopy() {},
  };
}

statyk.use(statykPlugin());

statyk.serve();
