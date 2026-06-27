const context = require('./context');
const prompt = require('./prompt');
const narrative = require('./narrative');
const service = require('./ai.service');

module.exports = {
  PromptContext: context.PromptContext,
  PromptContextBuilder: context.PromptContextBuilder,
  PromptBuilder: prompt.PromptBuilder,
  PromptRenderer: prompt.PromptRenderer,
  promptDefinitionRegistry: prompt.promptDefinitionRegistry,
  Narrative: narrative.Narrative,
  NarrativeBuilder: narrative.NarrativeBuilder,
  generateNarrative: service.generateNarrative,
  getNarrative: service.getNarrative,
  setLLMAdapter: service.setLLMAdapter,
};