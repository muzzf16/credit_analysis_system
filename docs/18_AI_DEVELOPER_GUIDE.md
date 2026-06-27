# AI_DEVELOPER_GUIDE.md

# AI Developer Guide - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Overview
This guide provides specific guidance for developers working on AI-related components of the Credit Analysis System. It covers AI architecture, prompt engineering, model integration, and best practices specific to AI development within the system.

## AI Architecture Overview

### Components
```
┌─────────────────────────────────────────────────────────────┐
│                    AI Credit Analyst Service                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ Prompt Engine │  │ LLM Adapter   │  │ Knowledge     │  │
│  │               │  │               │  │ Service       │  │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  │
│          │                  │                  │           │
│          └──────────────────┼──────────────────┘           │
│                             │                              │
│                    ┌────────▼────────┐                     │
│                    │  LLM Service    │                     │
│                    │  (Qwen3.5)      │                     │
│                    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Service Boundaries
- **AI Credit Analyst**: Business logic for credit analysis
- **Prompt Engine**: Template management and prompt construction
- **LLM Adapter**: Abstraction layer for different LLM providers
- **Knowledge Service**: Access to regulatory and policy knowledge
- **llama-server**: Local LLM serving infrastructure

## AI Development Principles

### 1. AI Assists, Rule Engine Decides
- AI provides analysis and recommendations
- Rule Engine makes final decisions
- Clear separation of concerns
- No AI approval/rejection authority

### 2. Explainability First
- Every AI output must include sources
- Confidence scores for all predictions
- Reasoning chains for all conclusions
- No black box decisions

### 3. Data Quality
- Validate all inputs before AI processing
- Ensure data freshness
- Handle missing data appropriately
- Document data assumptions

### 4. Safety and Compliance
- No PII in prompts unless necessary
- Encrypt sensitive data in transit
- Audit all AI interactions
- Comply with OJK regulations

## Prompt Engineering Guidelines

### Prompt Structure
```
1. System Role Definition
2. Task Instructions
3. Context Data
4. Knowledge Sources
5. Output Format Specification
6. Constraints and Guardrails
7. Examples (few-shot)
```

### Template Management

#### Directory Structure
```
backend/services/ai-analyst/prompts/
├── base/
│   ├── system_prompts/
│   │   ├── konsumtif.md
│   │   ├── produktif.md
│   │   └── general.md
│   └── task_prompts/
│       ├── executive_summary.md
│       ├── financial_analysis.md
│       ├── five_c_analysis.md
│       ├── swot_analysis.md
│       └── risk_analysis.md
├── templates/
│   ├── basic_loan_analysis.json
│   ├── complex_productive_loan.json
│   └── high_value_application.json
└── examples/
    └── sample_outputs/
```

#### Template Example
```json
{
  "templateId": "KONSUMTIF_STANDARD",
  "version": "1.2.0",
  "systemPrompt": "prompts/base/system_prompts/konsumtif.md",
  "taskPrompts": [
    "prompts/base/task_prompts/executive_summary.md",
    "prompts/base/task_prompts/five_c_analysis.md"
  ],
  "knowledgeFilters": {
    "categories": ["REGULATORY", "POLICY", "METHODOLOGY"],
    "productType": "KONSUMTIF",
    "minConfidenceScore": 0.7
  },
  "llmConfig": {
    "model": "qwen3.5",
    "temperature": 0.3,
    "maxTokens": 4000,
    "topP": 0.9
  },
  "outputValidation": {
    "requiredSections": [
      "executiveSummary",
      "fiveCAnalysis",
      "riskAnalysis",
      "recommendation"
    ],
    "requiredCitations": true,
    "maxResponseTimeMs": 30000
  }
}
```

### Prompt Writing Best Practices

#### System Prompts
```markdown
# Example: konsumtif.md

Anda adalah AI Credit Analyst yang bekerja untuk Sistem Analisa Kredit 
PT BPR BAPERA BATANG. Peran Anda adalah HANYA membantu analis manusia.

## Core Principles
1. AI tidak boleh memberikan keputusan approve/reject
2. Setiap pernyataan faktual harus memiliki atribusi sumber
3. Berikan confidence score untuk setiap analisis
4. Jelaskan alasan di balik setiap kesimpulan

## Analysis Framework
Gunakan framework 5C untuk analisis:
- Character (25%): Kepribadian dan reputasi debitur
- Capacity (30%): Kemampuan membayar
- Capital (15%): Modal sendiri
- Collateral (20%): Jaminan
- Condition (10%): Kondisi lingkungan

## Output Requirements
- Bahasa Indonesia yang baku dan formal
- Struktur sesuai template yang diberikan
- Sumber pengetahuan harus disebutkan secara spesifik
- Confidence score 0.0-1.0 untuk setiap bagian

## What You Should NOT Do
- Tidak boleh menyatakan "disetujui" atau "ditolak"
- Tidak boleh mengubah aturan Rule Engine
- Tidak boleh menggunakan informasi di luar yang diberikan
```

#### Task Prompts
```markdown
# Example: executive_summary.md

Buat Executive Summary untuk pengajuan kredit konsumtif berikut:

## Data Nasabah
- Nama: {{debitur.nama}}
- Usia: {{debitur.usia}} tahun
- Pekerjaan: {{debitur.pekerjaan}}
- Pendapatan: Rp {{debitur.pendapatan}}/bulan

## Data Pengajuan
- Produk: {{pengajuan.produk}}
- Jumlah: Rp {{pengajuan.jumlah}}
- Tenor: {{pengajuan.tenor}} bulan
- Tujuan: {{pengajuan.tujuan}}

## Hasil Rule Engine
{{ruleEngineResult}}

## Penugasan
Buat ringkasan yang:
1. Menangkap poin-poin kunci dari analisis lengkap
2. Menyoroti temuan kritis dan risiko utama
3. Memberikan rekomendasi berbasis analisis
4. Bersifat objektif dan berbasis data

Format: Maksimal 3 paragraf, bahasa Indonesia formal.
```

### Dynamic Prompt Construction

#### Context Builder
```typescript
class PromptContextBuilder {
  async buildContext(applicationId: string): Promise<PromptContext> {
    const application = await this.getApplication(applicationId);
    const debitur = await this.getDebitur(application.debiturId);
    const financials = await this.getFinancials(applicationId);
    const ruleResult = await this.getRuleEngineResult(applicationId);
    const knowledge = await this.getRelevantKnowledge(application);
    
    return {
      application,
      debitur,
      financials,
      ruleEngineResult: ruleResult,
      relevantKnowledge: knowledge,
      analysisType: this.determineAnalysisType(application.produkId),
      template: this.selectTemplate(application.produkId, application.jumlah),
      language: 'id-ID',
      timestamp: new Date().toISOString()
    };
  }
  
  private determineAnalysisType(produkId: string): string {
    const produktifProducts = ['Kredit_Modal_Kerja', 'Kredit_Investasi'];
    return produktifProducts.includes(produkId) ? 'PRODUKTIF' : 'KONSUMTIF';
  }
}
```

#### Template Engine
```typescript
class PromptTemplateEngine {
  render(templateId: string, context: PromptContext): string {
    const template = this.loadTemplate(templateId);
    let rendered = template;
    
    // Replace variables
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, this.formatValue(value));
    }
    
    // Process conditionals
    rendered = this.processConditionals(rendered, context);
    
    // Process loops
    rendered = this.processLoops(rendered, context);
    
    return rendered;
  }
  
  private formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
}
```

## LLM Integration

### Adapter Pattern
```typescript
interface LLMAdapter {
  complete(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
  embed(text: string): Promise<Embedding>;
  healthCheck(): Promise<boolean>;
}

class LlamaServerAdapter implements LLMAdapter {
  constructor(private config: LlamaConfig) {}
  
  async complete(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl}/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: this.config.model,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 0.9,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new LLMServiceError(`LLM request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].text,
      usage: data.usage,
      model: data.model
    };
  }
  
  async embed(text: string): Promise<Embedding> {
    const response = await fetch(`${this.config.embeddingUrl}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    const data = await response.json();
    return { vector: data.embedding, model: data.model };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### LLM Service Configuration
```typescript
const llmConfigs = {
  qwen3_5: {
    baseUrl: process.env.LLM_API_URL || 'http://172.22.0.1:1978',
    embeddingUrl: process.env.EMBEDDING_API_URL || 'http://172.22.0.1:1977',
    model: 'qwen3.5',
    temperature: 0.3,
    maxTokens: 4000,
    timeout: 30000,
    retries: 3,
    retryDelay: 1000
  },
  fallback: {
    baseUrl: process.env.FALLBACK_LLM_API_URL,
    model: 'llama3.1',
    temperature: 0.3,
    maxTokens: 2000
  }
};
```

## Output Processing and Validation

### Response Parser
```typescript
interface AIAnalysisOutput {
  executiveSummary: string;
  businessAnalysis: BusinessAnalysis;
  financialAnalysis: FinancialAnalysis;
  fiveCAnalysis: FiveCAnalysis;
  swotAnalysis: SWOTAnalysis;
  riskAnalysis: RiskAnalysis;
  riskMitigation: string[];
  recommendation: string;
  conclusion: string;
  sources: string[];
  confidenceScore: number;
  activeRules: string[];
  appliedPolicy: string;
}

class AIOutputValidator {
  validate(output: any): AIAnalysisOutput {
    const errors: ValidationError[] = [];
    
    // Check required fields
    const requiredFields = [
      'executiveSummary', 'businessAnalysis', 'financialAnalysis',
      'fiveCAnalysis', 'swotAnalysis', 'riskAnalysis',
      'riskMitigation', 'recommendation', 'conclusion',
      'sources', 'confidenceScore', 'activeRules', 'appliedPolicy'
    ];
    
    for (const field of requiredFields) {
      if (!(field in output)) {
        errors.push({
          field,
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing`
        });
      }
    }
    
    // Validate confidence score
    if (typeof output.confidenceScore !== 'number' ||
        output.confidenceScore < 0 ||
        output.confidenceScore > 1) {
      errors.push({
        field: 'confidenceScore',
        code: 'INVALID_CONFIDENCE_SCORE',
        message: 'Confidence score must be a number between 0 and 1'
      });
    }
    
    // Validate sources
    if (!Array.isArray(output.sources) || output.sources.length === 0) {
      errors.push({
        field: 'sources',
        code: 'MISSING_SOURCES',
        message: 'At least one source must be cited'
      });
    }
    
    // Validate no approve/reject language
    const forbiddenPhrases = [
      'disetujui', 'ditolak', 'approved', 'rejected',
      'layak', 'tidak layak', 'eligible', 'not eligible'
    ];
    
    const fullText = JSON.stringify(output).toLowerCase();
    for (const phrase of forbiddenPhrases) {
      if (fullText.includes(phrase)) {
        errors.push({
          field: 'content',
          code: 'FORBIDDEN_LANGUAGE',
          message: `Output contains forbidden phrase: '${phrase}'. AI must not approve/reject.`
        });
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError('AI output validation failed', errors);
    }
    
    return output as AIAnalysisOutput;
  }
}
```

## Knowledge Service Integration

### Knowledge Retrieval
```typescript
class KnowledgeRetriever {
  async getRelevantKnowledge(context: AnalysisContext): Promise<KnowledgeItem[]> {
    // Semantic search using embeddings
    const queryEmbedding = await this.embeddingService.embed(
      this.buildSearchQuery(context)
    );
    
    const results = await this.vectorStore.search(queryEmbedding, {
      topK: 10,
      filter: {
        categories: this.getRelevantCategories(context),
        status: 'PUBLISHED',
        effectiveDate: { $lte: new Date() },
        $or: [
          { expirationDate: null },
          { expirationDate: { $gte: new Date() } }
        ]
      }
    });
    
    // Rerank results
    const reranked = await this.rerank(results, context);
    
    return reranked.slice(0, 5);
  }
  
  private buildSearchQuery(context: AnalysisContext): string {
    const queries = [];
    
    if (context.productType === 'KONSUMTIF') {
      queries.push('kredit konsumtif analisis 5C DSR RPC');
    } else {
      queries.push('kredit produktif analisis GPM NPM DSCR');
    }
    
    if (context.businessType) {
      queries.push(context.businessType);
    }
    
    return queries.join(' ');
  }
}
```

## Error Handling and Resilience

### Retry Strategy
```typescript
class ResilientLLMService {
  async completeWithRetry(
    prompt: string,
    options?: LLMOptions
  ): Promise<LLMResponse> {
    const maxRetries = 3;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.llmAdapter.complete(prompt, options);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.sleep(delay);
          
          // Try fallback model on second attempt
          if (attempt === 2 && this.fallbackAdapter) {
            this.llmAdapter = this.fallbackAdapter;
          }
        }
      }
    }
    
    throw new LLMServiceError(
      `LLM request failed after ${maxRetries} attempts`,
      lastError
    );
  }
}
```

### Circuit Breaker
```typescript
class LLMCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerOpenError();
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
class AIResponseCache {
  private cache: Map<string, { response: AIResponse; expiry: number }>;
  
  async getCachedResponse(promptHash: string): Promise<AIResponse | null> {
    const cached = this.cache.get(promptHash);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.response;
    }
    
    return null;
  }
  
  async cacheResponse(promptHash: string, response: AIResponse, ttl: number) {
    this.cache.set(promptHash, {
      response,
      expiry: Date.now() + ttl
    });
  }
  
  private computePromptHash(prompt: string, options: LLMOptions): string {
    const crypto = require('crypto');
    const data = JSON.stringify({ prompt, options });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
```

### Batch Processing
```typescript
class BatchAnalysisProcessor {
  async processBatch(applicationIds: string[]): Promise<AnalysisResult[]> {
    const batchSize = 5;
    const results: AnalysisResult[] = [];
    
    for (let i = 0; i < applicationIds.length; i += batchSize) {
      const batch = applicationIds.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(id => this.analyzeApplication(id))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            applicationId: batch[results.length],
            success: false,
            error: result.reason.message
          });
        }
      }
      
      // Small delay between batches
      if (i + batchSize < applicationIds.length) {
        await this.sleep(1000);
      }
    }
    
    return results;
  }
}
```

## Testing AI Components

### Unit Testing with Mocks
```typescript
describe('AICreditAnalystService', () => {
  let service: AICreditAnalystService;
  let mockLLMAdapter: jest.Mocked<LLMAdapter>;
  let mockKnowledgeService: jest.Mocked<KnowledgeService>;
  
  beforeEach(() => {
    mockLLMAdapter = {
      complete: jest.fn(),
      embed: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true)
    } as any;
    
    mockKnowledgeService = {
      search: jest.fn(),
      getById: jest.fn()
    } as any;
    
    service = new AICreditAnalystService(
      mockLLMAdapter,
      mockKnowledgeService
    );
  });
  
  it('should generate executive summary', async () => {
    const mockResponse = {
      content: JSON.stringify({
        executiveSummary: 'Test summary',
        confidenceScore: 0.85,
        sources: ['SOP No. 1/2026']
      }),
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    };
    
    mockLLMAdapter.complete.mockResolvedValue(mockResponse);
    mockKnowledgeService.search.mockResolvedValue([]);
    
    const result = await service.analyzeApplication('app-123');
    
    expect(result.success).toBe(true);
    expect(result.data.executiveSummary).toBeDefined();
    expect(mockLLMAdapter.complete).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing
```typescript
describe('AIAnalyst Integration', () => {
  it('should complete full analysis flow', async () => {
    // Setup test data
    const application = await createTestApplication();
    
    // Run analysis
    const result = await aiAnalystService.analyzeApplication(application.id);
    
    // Verify output structure
    expect(result.success).toBe(true);
    expect(result.data.executiveSummary).toBeDefined();
    expect(result.data.sources.length).toBeGreaterThan(0);
    expect(result.data.confidenceScore).toBeGreaterThan(0);
    
    // Verify no forbidden language
    const forbiddenWords = ['disetujui', 'ditolak', 'approved', 'rejected'];
    const outputText = JSON.stringify(result.data).toLowerCase();
    for (const word of forbiddenWords) {
      expect(outputText).not.toContain(word);
    }
  });
});
```

## Monitoring and Observability

### Metrics to Track
- Request count and latency
- Token usage and costs
- Cache hit/miss rates
- Error rates by type
- Model response times
- User satisfaction scores

### Logging Standards
```typescript
const aiLogger = {
  info: (message: string, context: any) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      service: 'ai-analyst',
      message,
      context
    }));
  },
  
  error: (message: string, error: Error, context: any) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: 'ai-analyst',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    }));
  }
};
```

## Model Management

### Model Versioning
- Track model versions in use
- A/B testing for model improvements
- Rollback capability
- Performance monitoring per version

### Model Evaluation
- Accuracy metrics
- Bias detection
- Consistency checks
- User feedback collection

## Troubleshooting Guide

### Common Issues

#### LLM Service Unavailable
```typescript
// Check health endpoint
const health = await fetch('http://localhost:1978/health');
console.log('LLM Health:', health.status);

// Check model loaded
const models = await fetch('http://localhost:1978/models');
console.log('Available models:', await models.json());
```

#### Poor Quality Output
```typescript
// Review prompt template
// Check knowledge sources
// Verify temperature setting (should be 0.3 for consistency)
// Consider increasing max_tokens
// Review examples in knowledge base
```

#### Slow Response Times
```typescript
// Check token count (large prompts = slow)
// Enable caching for repeated queries
// Consider batching requests
// Check network latency to LLM server
// Monitor GPU utilization on LLM server
```

## Code Review Checklist for AI Components

- [ ] Prompt templates reviewed for clarity and completeness
- [ ] Knowledge sources properly cited
- [ ] Output validation implemented
- [ ] Error handling covers LLM failures
- [ ] Caching strategy appropriate
- [ ] Tests cover edge cases
- [ ] No hardcoded model parameters
- [ ] Logging is comprehensive
- [ ] Metrics are instrumented
- [ ] No forbidden approve/reject language
- [ ] Confidence scores included
- [ ] Sources are verifiable

## Appendix: Prompt Template Library

### Template Categories
1. **Executive Summary** - High-level overview
2. **Financial Analysis** - Detailed financial assessment
3. **5C Analysis** - Character, Capacity, Capital, Collateral, Condition
4. **SWOT Analysis** - Strengths, Weaknesses, Opportunities, Threats
5. **Risk Analysis** - Risk identification and assessment
6. **Recommendation** - Recommendations and next steps

### Template Versioning
- Semantic versioning for templates
- Change log maintained
- Backward compatibility considered
- Deprecation process defined

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*