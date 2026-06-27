'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../../config/database');
const config = require('../../config');

const makService = require('../mak/mak.service');
const CreditCaseBuilder = require('../case/builders/CreditCaseBuilder');
const AssessmentContextBuilder = require('../assessment/builders/AssessmentContextBuilder');
const { DecisionOrchestrator } = require('../decision-kernel');
const { AnalysisPackageBuilder } = require('../analysis-package');
const { PromptContextBuilder } = require('./context');
const { PromptBuilder, promptDefinitionRegistry } = require('./prompt');
const { NarrativeBuilder } = require('./narrative');
const { OpenAIAdapter, GeminiAdapter, OllamaAdapter, LlamaCppAdapter } = require('./adapters');

// Bootstrap prompt definitions directory
const definitionsDir = path.join(__dirname, 'prompt/definitions');
if (fs.existsSync(definitionsDir)) {
  promptDefinitionRegistry.loadFromDirectory(definitionsDir);
}

let customLlmAdapter = null;

/**
 * Override the LLM adapter (primarily for testing)
 */
function setLLMAdapter(adapter) {
  customLlmAdapter = adapter;
}

/**
 * Factory for LLM adapter based on provider config
 */
function getLLMAdapter() {
  if (customLlmAdapter) {
    return customLlmAdapter;
  }
  const provider = (config.llmProvider || 'openai').toUpperCase();
  if (provider === 'GEMINI') {
    return new GeminiAdapter({ apiKey: config.llmApiKey });
  }
  if (provider === 'OLLAMA') {
    return new OllamaAdapter({ baseUrl: config.llmApiUrl });
  }
  if (provider === 'LLAMACPP' || provider === 'LLAMA_CPP') {
    return new LlamaCppAdapter({
      baseUrl: config.llmApiUrl,
      apiKey: config.llmApiKey,
    });
  }
  // Default to OpenAI / OpenAI-compatible llama-server
  return new OpenAIAdapter({
    apiKey: config.llmApiKey,
    baseUrl: config.llmApiUrl,
  });
}

/**
 * Build AnalysisPackage from database makData snapshot
 */
function buildAnalysisPackageFromMak(makData) {
  const pengajuan = makData.pengajuan;
  const isKonsumtif = pengajuan.jenis_kredit === 'KONSUMTIF' || (!makData.analisaProduktif && makData.analisaKonsumtif);
  const financial = isKonsumtif ? (makData.analisaKonsumtif || {}) : (makData.analisaProduktif || {});

  // 1. Build CreditCase
  const caseBuilder = new CreditCaseBuilder();
  
  const application = {
    applicationId: pengajuan.id,
    plafon: Number(pengajuan.plafon_diajukan || 0),
    angsuran_perbulan: Number(pengajuan.angsuran_perbulan || 0),
    tenor: Number(pengajuan.jangka_waktu_bulan || 0),
    jenis_kredit: pengajuan.jenis_kredit,
    product: pengajuan.jenis_kredit === 'KONSUMTIF' ? 'KONSUMTIF' : 'KREDIT_MODAL_KERJA',
    income: isKonsumtif ? Number(financial.total_penghasilan || 0) : Number(financial.laba_bersih || 0),
    installment: isKonsumtif ? Number(financial.angsuran_diajukan || 0) : Number(financial.angsuran_diajukan || 0),
    sistem_angsuran: pengajuan.sistem_angsuran || 'FLAT',
  };
  caseBuilder.setApplication(application, pengajuan.id);

  const debitur = {
    id: pengajuan.debitur_id,
    nama: pengajuan.debitur_nama,
    nik: pengajuan.nik,
    gender: pengajuan.jenis_kelamin,
    alamat: pengajuan.alamat,
    status_nikah: pengajuan.status_pernikahan,
    hubungan_bank: pengajuan.hubungan_bank,
    kredit_aktif: pengajuan.kredit_aktif,
    ibu_kandung: pengajuan.ibu_kandung,
  };
  const debiturSources = { 'debitur.nama': 'OJK_KTP_SCAN', 'debitur.nik': 'OJK_KTP_SCAN' };
  const debiturProvenance = { 'debitur.nama': 'extracted', 'debitur.nik': 'extracted' };
  caseBuilder.setDebitur(debitur, debiturSources, debiturProvenance, 100);

  const agunans = makData.agunan || [];
  agunans.forEach((ag) => {
    const mappedAg = {
      id: ag.id,
      tipe: ag.tipe,
      nilai_pasar: Number(ag.nilai_pasar || 0),
      nilai_likuidasi: Number(ag.nilai_likuidasi || 0),
      deskripsi: ag.deskripsi,
      alamat: ag.alamat,
    };
    caseBuilder.addAgunan(mappedAg, null, null, 100);
  });

  const slikObj = makData.slik || {};
  const exposure = {
    totalBakiDebet: Number(slikObj.total_baki_debet || 0),
    totalAngsuran: Number(slikObj.total_angsuran || 0),
    kolektibilitasMax: Number(slikObj.kolektibilitas_max || 1),
  };
  caseBuilder.setCreditExposure(exposure, null, null, 100);

  const creditCase = caseBuilder.build();

  // 2. Build AssessmentContext
  const assessmentContextBuilder = new AssessmentContextBuilder();
  assessmentContextBuilder.setCreditCase(creditCase);
  assessmentContextBuilder.setScope('NEW_LOAN', application.product, false);
  
  // Use generic/default policy spec
  assessmentContextBuilder.setPolicy(
    'BPR-BAPERA-SOP-2024',
    '1.0.0',
    'sha256-bapera-sop-policy-pack-2024-v1'
  );
  
  assessmentContextBuilder.setQuality(
    100,
    { readyForScoring: true, readyForCommittee: true },
    { identity: 'READY', financial: 'READY', collateral: 'READY' }
  );

  if (makData.creditScoring) {
    assessmentContextBuilder.addAssumption(
      'CREDIT_SCORING_GRADE',
      `Grade Hasil Scoring BPR: ${makData.creditScoring.grade} (Score: ${makData.creditScoring.total_score})`
    );
  }

  const assessmentContext = assessmentContextBuilder.build();

  // 3. Execute DecisionOrchestrator to get Kernel
  const decisionResult = DecisionOrchestrator.execute(assessmentContext, {
    pipelinePlan: 'PRODUCTIVE_STANDARD',
    intentCode: 'STANDARD_INTENT',
    correlationId: `CORR-${pengajuan.id}`,
  });

  // 4. Build AnalysisPackage with mapped plain objects to comply with schema and prompt builder expectations
  const facts = {
    income: application.income,
    installment: application.installment,
    borrower: {
      name: pengajuan.debitur_nama || 'N/A',
      nik: pengajuan.nik || 'N/A',
      birthPlace: pengajuan.tempat_lahir || 'N/A',
      birthDate: pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID') : 'N/A',
      address: pengajuan.alamat || 'N/A',
      occupation: makData.pasangan?.nama ? `Bekerja (Pasangan: ${makData.pasangan.nama})` : 'Bekerja',
    }
  };
  const capabilities = {
    financial: {
      eligible: decisionResult.decisionFactsCollection?.financialEligible ?? true,
    },
    collateral: {
      secured: agunans.length > 0,
    }
  };

  return AnalysisPackageBuilder.build({
    decisionKernel: decisionResult.kernel,
    factCollection: facts,
    capabilityCollection: capabilities,
  });
}

/**
 * Generate AI Narrative for a loan application
 */
async function generateNarrative(pengajuanId) {
  // 1. Fetch data snapshot
  const makData = await makService.getMakData(pengajuanId);
  if (!makData) {
    throw new Error(`Data pengajuan ${pengajuanId} tidak lengkap.`);
  }

  // 2. Build AnalysisPackage
  const analysisPackage = buildAnalysisPackageFromMak(makData);

  // Build PromptContext (it automatically extracts borrower from facts)
  const promptContext = PromptContextBuilder.build(analysisPackage);

  // 4. Build prompt string
  const renderedPrompt = PromptBuilder.build(promptContext, 'MAK_STANDARD');
  
  // Instruct the system prompt explicitly to output structured JSON
  renderedPrompt.system += '\nFormat respons Anda sebagai JSON yang valid dengan properti berikut: executiveSummary (string), borrowerProfile (string), financialAnalysis (string), collateralAnalysis (string), riskAssessment (string), strengths (string), weaknesses (string), mitigation (string), recommendation (string), appendix (array of string). DILARANG menulis format markdown ```json di luar JSON tersebut.';

  // 5. Run LLM generation
  const adapter = getLLMAdapter();
  const llmResponse = await adapter.generate(renderedPrompt, {
    model: { name: config.llmModelName },
    generation: { temperature: 0.1, maxTokens: 4000 }
  });

  let content = llmResponse.content.trim();
  
  // Clean JSON formatting tags if generated by LLM
  if (content.startsWith('```json')) {
    content = content.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (content.startsWith('```')) {
    content = content.replace(/^```/, '').replace(/```$/, '').trim();
  }

  // extract brackets if present
  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(startIdx, endIdx + 1);
  }

  // 6. Build Narrative Entity
  const narrative = NarrativeBuilder.build(content);

  // 7. Save to database
  const result = await db.query(
    `INSERT INTO ai_narrative (pengajuan_id, narrative_data, prompt_context_fingerprint, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (pengajuan_id)
     DO UPDATE SET narrative_data = EXCLUDED.narrative_data, prompt_context_fingerprint = EXCLUDED.prompt_context_fingerprint, updated_at = NOW()
     RETURNING *`,
    [pengajuanId, JSON.stringify(narrative.toJSON()), promptContext.fingerprint]
  );

  return result.rows[0];
}

/**
 * Get AI Narrative by pengajuanId
 */
async function getNarrative(pengajuanId) {
  const result = await db.query(
    'SELECT * FROM ai_narrative WHERE pengajuan_id = $1',
    [pengajuanId]
  );
  return result.rows[0] || null;
}

module.exports = {
  generateNarrative,
  getNarrative,
  buildAnalysisPackageFromMak,
  setLLMAdapter,
};
