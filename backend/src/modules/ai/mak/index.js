const MakDocument = require('./entities/MakDocument');
const MakBuilder = require('./builder/MakBuilder');
const PdfRenderer = require('./renderers/PdfRenderer');
const HtmlRenderer = require('./renderers/HtmlRenderer');
const DocxRenderer = require('./renderers/DocxRenderer');

module.exports = {
  MakDocument,
  MakBuilder,
  PdfRenderer,
  HtmlRenderer,
  DocxRenderer,
};