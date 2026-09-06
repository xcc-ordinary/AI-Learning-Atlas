const assert = require("node:assert/strict");
const Module = require("node:module");

let request;
const originalLoad = Module._load;
Module._load = (name, parent, isMain) =>
  name === "obsidian"
    ? {
        Plugin: class {},
        PluginSettingTab: class {},
        Setting: class {},
        SecretComponent: class {},
        ItemView: class {},
        Notice: class {},
        TFile: class {},
        MarkdownView: class {},
        normalizePath: (value) => value,
        requestUrl: async (options) => {
          request = options;
          return {
            status: 200,
            json: { choices: [{ message: { content: "译文" } }] },
          };
        },
      }
    : originalLoad(name, parent, isMain);

const Atlas = require("../src/main.js");
const plugin = new Atlas();
plugin.app = {
  secretStorage: { getSecret: (id) => (id === "deep-key" ? "secret" : null) },
};
plugin.settings = {
  provider: "deepseek",
  deepSeekModel: "deepseek-v4-flash",
  deepSeekSecretId: "deep-key",
  targetLanguage: "简体中文",
  systemPrompt: "translate",
};

(async () => {
  assert.equal(await plugin.callAI("hello"), "译文");
  assert.equal(request.url, "https://api.deepseek.com/chat/completions");
  assert.equal(request.headers.Authorization, "Bearer secret");
  const body = JSON.parse(request.body);
  assert.deepEqual(body.thinking, { type: "disabled" });
  assert.equal(body.model, "deepseek-v4-flash");
  console.log("AI provider smoke test OK");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
