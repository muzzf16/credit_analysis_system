const { instance: stageRegistry } = require('../registry/stage.registry');

/**
 * Stage Resolver
 * 
 * Resolves a Stage by its code so Pipeline doesn't have to instantiate it directly.
 */
class StageResolver {
  static resolve(code) {
    const StageClass = stageRegistry.get(code);
    
    if (!StageClass) {
      throw new Error(`StageResolver: Stage [${code}] not found in registry.`);
    }

    return StageClass;
  }
}

module.exports = StageResolver;
