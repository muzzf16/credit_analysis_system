const PromptBuilder = require('./builder/PromptBuilder');
const PromptRenderer = require('./renderer/PromptRenderer');
const { instance: promptDefinitionRegistry, PromptDefinitionRegistry } = require('./registry/definition.registry');

module.exports = {
  PromptBuilder,
  PromptRenderer,
  promptDefinitionRegistry,
  PromptDefinitionRegistry,
};