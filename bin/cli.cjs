#!/usr/bin/env node

// cjs extension is important
const { build, watch } = require("../dist/index.cjs");
const { Command } = require("commander");

const program = new Command();

program.command("build").action(build);

program.command("watch").action(watch);

program.parse(process.argv);
