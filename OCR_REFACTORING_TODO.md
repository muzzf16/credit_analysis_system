# OCR Feature Refactoring Todo List

## Critical Issues (Must Fix)

### 1. Fix TesseractEngine.js Syntax Error
- **File**: `/workspace/backend/src/modules/ocr/engines/TesseractEngine.js`
- **Issue**: Line 244 has an extra closing parenthesis in the finally block
- **Current Code**: `} finally {` at line 242, but there's a mismatched brace structure
- **Fix**: Review and fix the brace matching around lines 240-244
- **Priority**: 🔴 HIGH - This will cause runtime errors

### 2. Fix PdfTextEngine.js Incorrect Usage
- **File**: `/workspace/backend/src/modules/ocr/engines/PdfTextEngine.js`
- **Issue**: Line 2 uses destructuring import `{ PDFParse }` and line 13 uses `new PDFParse()`
- **Root Cause**: pdf-parse exports a function, not a class. The correct usage is:
  ```javascript
  const pdfParse = require('pdf-parse');
  const pdfData = await pdfParse(uint8Array);
  ```
- **Fix**: 
  - Change line 2 to: `const pdfParse = require('pdf-parse');`
  - Change lines 13-14 to: `const pdfData = await pdfParse(uint8Array);`
- **Priority**: 🔴 HIGH - This will cause runtime errors

## Code Quality Improvements

### 3. Reduce OCRPipeline.js Complexity
- **File**: `/workspace/backend/src/modules/ocr/pipeline/OCRPipeline.js`
- **Issues**:
  - File is 175 lines with many responsibilities
  - Mixed concerns: orchestration, logging, event handling, debugging
  - Hard-coded debug logic for KTP and SLIK documents (lines 38-46, 136-161)
- **Refactoring Tasks**:
  - [ ] Extract debug logging to a separate `DebugLogger` module
  - [ ] Extract event logging to a dedicated `EventLogger` service
  - [ ] Move document-specific debug logic to respective parser modules
  - [ ] Consider breaking into smaller pipeline stage classes
- **Priority**: 🟡 MEDIUM

### 4. Standardize Error Handling
- **Files**: All OCR modules
- **Issues**:
  - Inconsistent try/catch usage
  - Some areas swallow errors with console.warn, others throw
  - Error objects sometimes include status codes, sometimes don't
- **Refactoring Tasks**:
  - [ ] Create a standard error handling utility for OCR module
  - [ ] Define consistent error object structure
  - [ ] Review all catch blocks for consistent behavior
  - [ ] Add proper error context/logging
- **Priority**: 🟡 MEDIUM

### 5. Improve Logging Structure
- **Files**: All OCR modules
- **Issues**:
  - Mixed use of console.log, console.warn, console.error
  - Debug logs are helpful but not structured
  - No log levels configuration
- **Refactoring Tasks**:
  - [ ] Create a logger utility module for OCR
  - [ ] Add log levels (DEBUG, INFO, WARN, ERROR)
  - [ ] Make debug logging configurable via environment variable
  - [ ] Remove hard-coded file paths in debug logs (e.g., `/tmp/slik_raw.txt`)
- **Priority**: 🟢 LOW

## Additional Observations

### 6. Resource Cleanup
- **File**: TesseractEngine.js
- **Issue**: Temporary file cleanup in finally blocks could be more robust
- **Recommendation**: Consider using a temp file manager utility

### 7. Magic Number Constants
- **Files**: TesseractEngine.js, OCRPipeline.js
- **Issue**: Hard-coded values like confidence thresholds, timeout values
- **Recommendation**: Extract to configuration constants

### 8. Test Coverage
- **Recommendation**: Add unit tests for each engine after refactoring
- **Priority**: 🟢 LOW (but important for long-term maintenance)

---

## Refactoring Order Recommendation

1. **First**: Fix critical syntax/runtime errors (Items 1 & 2)
2. **Second**: Standardize error handling (Item 4)
3. **Third**: Improve logging (Item 5)
4. **Fourth**: Reduce complexity (Item 3)
5. **Finally**: Address additional observations (Items 6-8)

## Testing Checklist After Refactoring

- [ ] Test PDF text extraction with PdfTextEngine
- [ ] Test image OCR with TesseractEngine
- [ ] Test PDF-to-image OCR with TesseractEngine
- [ ] Verify error handling for corrupted files
- [ ] Verify temporary file cleanup
- [ ] Test with different document types (KTP, SLIK, etc.)
- [ ] Verify event logging still works
- [ ] Performance regression test
