const { instance: definitionRegistry } = require('../registry/definition.registry');

class DefinitionResolver {
  static resolve(code) {
    const entity = definitionRegistry.get(code);
    
    if (!entity) {
      throw new Error(`DefinitionResolver: CapabilityDefinition [${code}] not found.`);
    }

    return entity;
  }
}

module.exports = DefinitionResolver;
