import { Download } from 'lucide-react'
import { useAssessmentContext } from '../App'

// LOINC answer codes for PHQ-9/GAD-7 options
const ANSWER_CODES = [
  { value: 0, code: 'LA6568-5', display: 'Not at all' },
  { value: 1, code: 'LA6569-3', display: 'Several days' },
  { value: 2, code: 'LA6570-1', display: 'More than half the days' },
  { value: 3, code: 'LA6571-9', display: 'Nearly every day' },
]

// PHQ-9 question LOINC codes
const PHQ9_ITEM_CODES = [
  { linkId: 'phq9-q1', code: '44250-9', text: 'Little interest or pleasure in doing things' },
  { linkId: 'phq9-q2', code: '44255-8', text: 'Feeling down, depressed, or hopeless' },
  { linkId: 'phq9-q3', code: '44259-0', text: 'Trouble falling or staying asleep, or sleeping too much' },
  { linkId: 'phq9-q4', code: '44254-1', text: 'Feeling tired or having little energy' },
  { linkId: 'phq9-q5', code: '44251-7', text: 'Poor appetite or overeating' },
  { linkId: 'phq9-q6', code: '44258-2', text: 'Feeling bad about yourself — or that you are a failure' },
  { linkId: 'phq9-q7', code: '44252-5', text: 'Trouble concentrating on things' },
  { linkId: 'phq9-q8', code: '44253-3', text: 'Moving or speaking so slowly that other people could have noticed' },
  { linkId: 'phq9-q9', code: '44260-8', text: 'Thoughts that you would be better off dead, or of hurting yourself' },
]

// GAD-7 question LOINC codes
const GAD7_ITEM_CODES = [
  { linkId: 'gad7-q1', code: '69725-0', text: 'Feeling nervous, anxious, or on edge' },
  { linkId: 'gad7-q2', code: '68509-9', text: 'Not being able to stop or control worrying' },
  { linkId: 'gad7-q3', code: '69733-4', text: 'Worrying too much about different things' },
  { linkId: 'gad7-q4', code: '69734-2', text: 'Trouble relaxing' },
  { linkId: 'gad7-q5', code: '69735-9', text: 'Being so restless that it is hard to sit still' },
  { linkId: 'gad7-q6', code: '69736-7', text: 'Becoming easily annoyed or irritable' },
  { linkId: 'gad7-q7', code: '69689-8', text: 'Feeling afraid, as if something awful might happen' },
]

/**
 * Builds a FHIR R4 QuestionnaireResponse for a single questionnaire.
 * Uses LOINC codes for questionnaire, items, and answers.
 */
function buildQuestionnaireResponse(key, itemCodes, answers, score, loincCode, displayName, now) {
  if (!answers || answers.length === 0) return null

  /** @type {fhir4.QuestionnaireResponse} */
  const response = {
    resourceType: 'QuestionnaireResponse',
    id: `${key}-response`,
    questionnaire: `http://loinc.org/vs/${loincCode}`,
    status: 'completed',
    authored: now,
    subject: { reference: 'Patient/anonymous' },
    item: itemCodes.map((item, i) => {
      const answerValue = answers[i] ?? 0
      const answerCode = ANSWER_CODES.find(a => a.value === answerValue) || ANSWER_CODES[0]
      return {
        linkId: item.linkId,
        text: item.text,
        definition: `http://loinc.org/${item.code}`,
        answer: [{
          valueCoding: {
            system: 'http://loinc.org',
            code: answerCode.code,
            display: answerCode.display,
          }
        }]
      }
    }),
  }

  // Add total score as an additional item
  response.item.push({
    linkId: `${key}-score`,
    text: `${displayName} total score`,
    definition: `http://loinc.org/${loincCode}`,
    answer: [{
      valueInteger: score,
    }]
  })

  return response
}

/**
 * Builds a FHIR R4 Observation for AI risk assessment.
 * @param {string} riskLevel
 * @param {string[]} signals
 * @param {number} confidence
 * @param {string} now
 * @returns {fhir4.Observation}
 */
function buildRiskObservation(riskLevel, signals, confidence, now) {
  /** @type {fhir4.Observation} */
  const obs = {
    resourceType: 'Observation',
    id: 'ai-risk-observation',
    status: 'preliminary',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'survey',
        display: 'Survey',
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '75626-2',
        display: 'Mental health crisis risk level',
      }],
      text: 'AI-assisted mental health crisis risk assessment',
    },
    subject: { reference: 'Patient/anonymous' },
    effectiveDateTime: now,
    method: {
      coding: [{
        system: 'http://safepoint.app/fhir/CodeSystem/method',
        code: 'ai-nlp',
        display: 'AI Natural Language Processing (DistilBERT)',
      }]
    },
    valueCodeableConcept: {
      coding: [{
        system: 'http://safepoint.app/fhir/CodeSystem/risk-level',
        code: riskLevel,
        display: riskLevel,
      }]
    },
    component: [
      {
        code: {
          coding: [{
            system: 'http://safepoint.app/fhir/CodeSystem/ai-metric',
            code: 'confidence',
            display: 'Model confidence score',
          }]
        },
        valueQuantity: {
          value: Math.round(confidence * 100) / 100,
          unit: 'score',
          system: 'http://unitsofmeasure.org',
          code: '{score}',
        }
      },
      ...(signals || []).map(signal => ({
        code: {
          coding: [{
            system: 'http://safepoint.app/fhir/CodeSystem/crisis-signal',
            code: signal,
            display: signal.replace(/_/g, ' '),
          }]
        },
        valueBoolean: true,
      }))
    ]
  }
  return obs
}

/**
 * Exports a FHIR R4 Bundle containing:
 * - QuestionnaireResponse for PHQ-9 (with per-item answers and LOINC codes)
 * - QuestionnaireResponse for GAD-7 (with per-item answers and LOINC codes)
 * - Observation for AI risk assessment
 *
 * No server involved — generated entirely in the browser.
 */
export default function ExportFhir({ result }) {
  const { assessment } = useAssessmentContext()

  if (!result) return null

  const handleExport = () => {
    const now = new Date().toISOString()
    const entries = []

    // PHQ-9 QuestionnaireResponse
    const phq9Response = buildQuestionnaireResponse(
      'phq9',
      PHQ9_ITEM_CODES,
      assessment.questionnaireAnswers?.phq9,
      result.phq9Score,
      '44249-1',
      'PHQ-9',
      now
    )
    if (phq9Response) {
      entries.push({
        fullUrl: 'urn:uuid:phq9-response',
        resource: phq9Response,
      })
    }

    // GAD-7 QuestionnaireResponse
    const gad7Response = buildQuestionnaireResponse(
      'gad7',
      GAD7_ITEM_CODES,
      assessment.questionnaireAnswers?.gad7,
      result.gad7Score,
      '69737-5',
      'GAD-7',
      now
    )
    if (gad7Response) {
      entries.push({
        fullUrl: 'urn:uuid:gad7-response',
        resource: gad7Response,
      })
    }

    // AI Risk Observation
    if (result.riskLevel) {
      entries.push({
        fullUrl: 'urn:uuid:ai-risk',
        resource: buildRiskObservation(
          result.riskLevel,
          result.aiAnalysis?.signals,
          result.aiAnalysis?.confidence || 0,
          now
        )
      })
    }

    // FHIR R4 Bundle
    /** @type {fhir4.Bundle} */
    const bundle = {
      resourceType: 'Bundle',
      id: `safepoint-${Date.now()}`,
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Bundle'],
        tag: [{
          system: 'http://safepoint.app/fhir/tag',
          code: 'anonymous-screening',
          display: 'Anonymous SafePoint Screening',
        }]
      },
      type: 'collection',
      timestamp: now,
      entry: entries,
    }

    // Download
    const blob = new Blob(
      [JSON.stringify(bundle, null, 2)],
      { type: 'application/fhir+json' }
    )
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `safepoint-fhir-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center justify-center gap-2 py-3 rounded-xl border font-medium w-full"
      style={{ borderColor: 'var(--sand-dark)', color: 'var(--charcoal)' }}
    >
      <Download size={18} /> Export for healthcare provider (FHIR R4)
    </button>
  )
}
