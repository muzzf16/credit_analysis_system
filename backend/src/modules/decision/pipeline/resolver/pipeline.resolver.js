const { instance: pipelineRegistry } = require('../registry/pipeline.registry');

class PipelineResolver {
  static resolve(context) {
    if (!context || !context.pipeline) {
      throw new Error('PipelineResolver: Context must contain "pipeline" code.');
    }

    const entity = pipelineRegistry.get(context.pipeline, context.version);
    
    if (!entity) {
      throw new Error(`PipelineResolver: Pipeline [${context.pipeline}] version [${context.version || 'LATEST'}] not found.`);
    }

    if (entity.metadata.status !== 'ACTIVE') {
      throw new Error(`PipelineResolver: Pipeline [${context.pipeline}] is not ACTIVE.`);
    }

    return entity;
  }
}

module.exports = PipelineResolver;
