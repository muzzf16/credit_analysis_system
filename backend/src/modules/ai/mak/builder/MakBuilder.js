const MakDocument = require('../entities/MakDocument');

class MakBuilder {
  static build(narrative) {
    return new MakDocument(narrative.toJSON());
  }
}

module.exports = MakBuilder;