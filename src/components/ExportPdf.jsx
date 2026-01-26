import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'

/**
 * Generates an anonymous PDF report of the assessment result.
 * Uses jsPDF — no server involved, no data leaves the browser.
 */
export default function ExportPdf({ result }) {
  const [loading, setLoading] = useState(false)

  if (!result) return null

  const handleExport = () => {
    setLoading(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = 210
      const margin = 20
      const contentW = pageW - margin * 2
      let y = 20

      // ── Helper functions ──────────────────────────────────────────────
      const line = (text, fontSize = 11, bold = false, color = [44, 44, 44]) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(...color)
        const lines = doc.splitTextToSize(text, contentW)
        doc.text(lines, margin, y)
        y += lines.length * (fontSize * 0.4) + 2
      }

      const spacer = (h = 5) => { y += h }

      const box = (label, value, color = [245, 240, 232]) => {
        doc.setFillColor(...color)
        doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(100, 100, 100)
        doc.text(label, margin + 4, y + 5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(44, 44, 44)
        doc.text(String(value), margin + 4, y + 10)
        y += 16
      }

      const divider = () => {
        doc.setDrawColor(220, 215, 205)
        doc.line(margin, y, pageW - margin, y)
        y += 6
      }

      // ── Risk colors ───────────────────────────────────────────────────
      const riskColor = {
        LOW:    [124, 154, 126],
        MEDIUM: [212, 168, 67],
        HIGH:   [192, 85, 58],
      }[result.riskLevel] || [100, 100, 100]

      // ── Header ────────────────────────────────────────────────────────
      doc.setFillColor(74, 107, 76)
      doc.rect(0, 0, pageW, 18, 'F')
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('SafePoint', margin, 12)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Mental Health Crisis Screening Report', margin + 30, 12)

      // Date top right
      const now = new Date()
      doc.setFontSize(8)
      doc.text(now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }), pageW - margin - 40, 12)

      y = 28

      // ── Risk Level ────────────────────────────────────────────────────
      doc.setFillColor(...riskColor)
      doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F')
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(result.riskLevel + ' RISK', margin + 6, y + 8)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const riskMsg = {
        LOW:    'Responses suggest relatively low distress at this time.',
        MEDIUM: 'Responses suggest moderate distress. Consider professional support.',
        HIGH:   'Responses suggest significant distress. Please reach out for help.',
      }[result.riskLevel] || ''
      doc.text(riskMsg, margin + 6, y + 14)
      y += 24

      // ── Questionnaire scores ──────────────────────────────────────────
      line('Questionnaire Scores', 12, true)
      spacer(3)

      if (result.phq9Score != null) {
        const sev = result.phq9Score >= 20 ? 'Severe'
                  : result.phq9Score >= 15 ? 'Moderately Severe'
                  : result.phq9Score >= 10 ? 'Moderate'
                  : result.phq9Score >= 5  ? 'Mild' : 'Minimal'
        box(`PHQ-9 Depression Screen  (score range 0–27)`,
            `${result.phq9Score} / 27 — ${sev}`)
      }

      if (result.gad7Score != null) {
        const sev = result.gad7Score >= 15 ? 'Severe'
                  : result.gad7Score >= 10 ? 'Moderate'
                  : result.gad7Score >= 5  ? 'Mild' : 'Minimal'
        box(`GAD-7 Anxiety Screen  (score range 0–21)`,
            `${result.gad7Score} / 21 — ${sev}`)
      }

      spacer(2)
      divider()

      // ── AI analysis ───────────────────────────────────────────────────
      if (result.aiAnalysis) {
        line('AI Text Analysis', 12, true)
        spacer(3)
        box('Risk level from text', result.aiAnalysis.riskLevel || '—')
        box('Confidence', `${Math.round((result.aiAnalysis.confidence || 0) * 100)}%`)

        if (result.aiAnalysis.signals?.length > 0) {
          box('Detected signals',
              result.aiAnalysis.signals.map(s => s.replace(/_/g, ' ')).join(', '))
        }

        spacer(2)
        divider()
      }

      // ── Crisis resources ──────────────────────────────────────────────
      line('Crisis Resources', 12, true)
      spacer(4)

      doc.setFillColor(237, 244, 238)
      doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(74, 107, 76)
      doc.text('988 Suicide & Crisis Lifeline', margin + 4, y + 8)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text('Free, confidential support 24/7', margin + 4, y + 14)
      doc.text('Call or text: 988', margin + 4, y + 20)
      doc.text('Online chat: 988lifeline.org', margin + 4, y + 26)
      y += 34

      spacer(2)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text('Crisis Text Line: Text HOME to 741741', margin, y)
      y += 5
      doc.text('SAMHSA Helpline: 1-800-662-4357', margin, y)
      y += 5
      doc.text('International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/', margin, y)

      spacer(8)
      divider()

      // ── Disclaimer ────────────────────────────────────────────────────
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      const disclaimer = 'This report is generated by SafePoint for informational purposes only. ' +
        'It is not a clinical diagnosis and should not replace professional medical advice. ' +
        'PHQ-9 and GAD-7 are validated screening tools but require clinical interpretation. ' +
        'If you are in immediate danger, call 911.'
      const discLines = doc.splitTextToSize(disclaimer, contentW)
      doc.text(discLines, margin, y)
      y += discLines.length * 4

      spacer(4)

      // ── Footer ────────────────────────────────────────────────────────
      doc.setFillColor(245, 240, 232)
      doc.rect(0, 285, pageW, 12, 'F')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('SafePoint — Anonymous Mental Health Screening', margin, 292)
      doc.text('safepoint.app', pageW - margin - 20, 292)

      // ── Save ──────────────────────────────────────────────────────────
      const filename = `safepoint-report-${now.toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
    } catch (e) {
      console.error('PDF export error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center justify-center gap-2 py-3 rounded-xl border font-medium w-full"
      style={{ borderColor: 'var(--sand-dark)', color: 'var(--charcoal)' }}
    >
      {loading
        ? <><Loader2 size={18} className="animate-spin" /> Generating PDF...</>
        : <><Download size={18} /> Download report (PDF)</>
      }
    </button>
  )
}
