# Plan: AI Credit Analyst Architecture v1.0 (LOCKED)

## Goal
Implement AI Credit Analyst as a **bounded context** with strict boundaries, following the principle that AI is a **View** on top of deterministic decision artifacts.

---

## 🔒 ARCHITECTURAL PRINCIPLES (LOCKED)

### 1. AI as Bounded Context
```text
backend/src/modules/ai/
├── context/      # PromptContext (AI View Model)
├── prompt/       # Prompt Definitions (immutable artifacts)
├── adapters/     # LLM Adapters (provider-agnostic)
├── narrative/    # Narrative Entity
├── mak/          # MAK Builder (Presentation Layer)
└── registry/     # Prompt Definition Registry
```
- AI is a sibling module to `decision-kernel`, `analysis-package`, etc.
- New AI features (Fraud Detection, Customer Service, Collection) become siblings.

### 2. AnalysisPackage = AI Contract (LOCKED)
```
Decision Platform
        │
        ▼
AnalysisPackage  ←─ SINGLE SOURCE OF TRUTH FOR AI
=========================
BOUNDARY
=========================
AI Platform
```
- AI modules MUST NOT access: Database, ORM, Rules, Formulas, Stages, Pipelines, Assessments, DecisionKernel, Facts, Capabilities directly.
- Only input: `AnalysisPackage`.

### 3. AI Boundary Rule (LOCKED)
> All modules in `modules/ai/` are **FORBIDDEN** from accessing:
> - Database / ORM
> - Rule Library
> - Formula Engine
> - Stage Engine
> - Pipeline Engine
> - AssessmentContext
> - DecisionKernel
> - FactCollection
> - CapabilityCollection
>
> **Only input: `AnalysisPackage`.**

---

## Module Structure

```text
backend/src/modules/ai/
├── context/
│   ├── entities/PromptContext.js
│   ├── builder/PromptContextBuilder.js
│   ├── schemas/prompt-context.schema.json
│   └── index.js
│
├── prompt/
│   ├── definitions/
│   │   ├── mak-standard-v1.0.0.json
│   │   ├── risk-review-v1.0.0.json
│   │   └── ...
│   ├── builder/PromptBuilder.js
│   ├── renderer/PromptRenderer.js
│   └── registry/PromptDefinitionRegistry.js
│
├── adapters/
│   ├── LLMAdapter.js         # interface
│   ├── OpenAIAdapter.js
│   ├── GeminiAdapter.js
│   ├── GLMAdapter.js
│   ├── QwenAdapter.js
│   └── OllamaAdapter.js
│
├── narrative/
│   ├── entities/Narrative.js
│   ├── builder/NarrativeBuilder.js
│   ├── schemas/narrative.schema.json
│   └── index.js
│
├── mak/
│   ├── entities/MakDocument.js
│   ├── builder/MakBuilder.js
│   ├── renderers/
│   │   ├── PdfRenderer.js
│   │   ├── DocxRenderer.js
│   │   └── HtmlRenderer.js
│   └── index.js
│
├── registry/
│   └── index.js
│
└── index.js
```

---

## Data Flow

```text
AnalysisPackage
       │
       ▼
PromptContextBuilder.build(analysisPackage)
       │
       ▼
PromptContext { summary, risk, facts, ... }
       │
       ▼
PromptBuilder.build(promptContext, promptDefinition)
       │
       ▼
RenderedPrompt { system, developer, user, metadata }
       │
       ▼
LLMAdapter.generate(renderedPrompt, options)
       │
       ▼
LLM Response → NarrativeBuilder.build(response)
       │
       ▼
Narrative { executiveSummary, financialAnalysis, ... }
       │
       ▼
MakBuilder.build(narrative)
       │
       ▼
MakDocument → PDF/DOCX/HTML
```

---

## Prompt Definition Schema

```json
{
  "code": "MAK_STANDARD",
  "version": "1.0.0",
  "locale": "id-ID",
  "analysisMode": "PRODUCTIVE",
  "targetAudience": "COMMITTEE",
  "supportedModels": ["GPT", "Gemini", "GLM", "Qwen", "Ollama"],
  "metadata": {
    "createdAt": "...",
    "createdBy": "...",
    "approvedBy": "..."
  },
  "system": "...",
  "developer": "...",
  "userTemplate": "..."
}
```

---

## LLM Adapter Interface

```typescript
interface GenerateOptions {
  model: {
    provider: 'OPENAI' | 'GEMINI' | 'GLM' | 'QWEN' | 'OLLAMA';
    name: string;
  };
  generation: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

interface LLMAdapter {
  generate(renderedPrompt: RenderedPrompt, options: GenerateOptions): Promise<LLMResponse>;
}
```

---

## Narrative Entity Schema

```json
{
  "executiveSummary": "...",
  "borrowerProfile": "...",
  "financialAnalysis": "...",
  "collateralAnalysis": "...",
  "creditHistoryAnalysis": "...",
  "riskAssessment": "...",
  "strengths": "...",
  "weaknesses": "...",
  "mitigation": "...",
  "recommendation": "...",
  "appendix": []
}
```

---

## Task Breakdown

### Sprint 6.2: AI Context Layer ✅ Selesai
- `PromptContext` entity + schema
- `PromptContextBuilder`: AnalysisPackage → PromptContext
- Immutability, 3 tests passing

### Sprint 6.3: Prompt Definitions & Builder
- Prompt Definition JSON schema
- `PromptBuilder`: PromptContext + Definition → RenderedPrompt
- `PromptRenderer`: string interpolation
- `PromptDefinitionRegistry`
- Tests: prompt rendering, immutability

### Sprint 6.4: LLM Adapters
- `LLMAdapter` interface
- Implementations: OpenAI, Gemini, GLM, Qwen, Ollama
- Provider-agnostic interface
- Tests: mock responses, contract validation

### Sprint 6.5: Narrative Engine
- `Narrative` entity + schema
- `NarrativeBuilder`: parse LLM JSON → Narrative
- Tests: JSON parsing, field validation

### Sprint 6.6: MAK Builder
- `MakDocument` entity
- `MakBuilder`: Narrative → MakDocument
- Renderers: PDF, DOCX, HTML
- Tests: document generation

---

## Files to Create/Modify

### New Files
- `backend/src/modules/ai/**` (entire module)
- `backend/tests/modules/ai/**` (tests)

### Update Files
- `backend/src/modules/analysis-package/schemas/analysis-package.schema.json` — add manifest/fingerprints/metadata/configuration
- `backend/src/modules/analysis-package/entities/AnalysisPackage.js` — add getters
- `backend/src/modules/analysis-package/builder/AnalysisPackageBuilder.js` — compute fingerprints

### DO NOT Modify (LOCKED)
- `backend/src/modules/decision-kernel/`
- `backend/src/modules/facts/`
- `backend/src/modules/decision-policy/`
- `backend/src/modules/rules/`
- `backend/src/modules/formulas/`
- Credit formulas (DSR, RPC, DSCR)

---

## 🔒 ADDITIONAL ARCHITECTURAL PRINCIPLES (LOCKED)

### 1. Stable Contract Rule

Semua artefak lintas-bounded-context harus bersifat **append-only**.

* `AnalysisPackage v1.0` tidak boleh mengubah atau menghapus field yang sudah dipublikasikan.
* Evolusi dilakukan dengan:
  * menambah field opsional, atau
  * membuat `AnalysisPackage v2`.

Ini menjaga kompatibilitas untuk AI, dashboard, workflow, dan integrasi eksternal.

---

### 2. Prompt Version Independence

Prompt Definition memiliki lifecycle sendiri yang independen dari AnalysisPackage.

```text
AnalysisPackage v1.0
        │
        ├── MAK Prompt v1
        ├── MAK Prompt v2
        ├── Risk Review Prompt
        └── Executive Summary Prompt
```

Perubahan prompt **tidak boleh** mengharuskan perubahan `AnalysisPackage`.

---

### 3. Provider Independence Rule

Seluruh kode di luar `modules/ai/adapters/` tidak boleh mengenal SDK vendor.

**DILARANG di:**
* Prompt Builder
* Narrative Builder
* MAK Builder

**Hanya boleh di:**
* `modules/ai/adapters/`

Semua komunikasi provider harus berhenti di `LLMAdapter`.

---

## Architecture Lock

Dengan prinsip-prinsip ini, arsitektur dapat diangap **LOCKED** pada level platform.

### Final Hierarchy

```text
Document Intelligence
        │
Domain Platform
        │
Decision Platform
        │
Analysis Package
=========================
AI Boundary
=========================
Prompt Context
    │
Prompt Definition
    │
Rendered Prompt
    │
LLM Adapter
    │
Narrative
    │
MAK Builder
    │
Presentation (PDF/DOCX/HTML)
```

**Prinsip utama:**
> **Decision Platform menghasilkan fakta dan keputusan deterministik.**
> **AI Platform hanya mengubah fakta tersebut menjadi narasi.**

---

## Validation

1. **Unit tests** for each module
2. **Integration test**: AnalysisPackage → PromptContext → Prompt → LLM → Narrative
3. **Schema validation** for all new entities
4. **AI Boundary Rule verification**: no direct database/assessment access from AI modules

---

## Open Questions

1. Should Prompt Definition support locale-specific templates (id, en)?
2. Should LLM Adapter support streaming response?
3. Should Narrative support partial updates?