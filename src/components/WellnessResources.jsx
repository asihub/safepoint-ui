import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { ChevronDown, ChevronUp, ExternalLink, Heart, Wind, Moon, Users, BookOpen, Activity } from 'lucide-react'

/**
 * Adaptive wellness resources shown for LOW risk.
 * Recommendations are tailored based on PHQ-9 and GAD-7 item scores.
 * Clinical safety note: all resources are psychoeducational or peer support only.
 * No medical advice, no medication recommendations, no AI chatbot referrals.
 */

const RESOURCES = {
  breathing: {
    icon: <Wind size={18} />,
    title: 'Breathing exercises',
    titleEs: 'Ejercicios de respiración',
    desc: 'Box breathing (4-4-4-4) and 4-7-8 techniques reduce anxiety within minutes. Clinically validated, no side effects.',
    descEs: 'La respiración cuadrada y la técnica 4-7-8 reducen la ansiedad en minutos. Validadas clínicamente.',
    link: 'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/',
    linkLabel: 'NHS breathing guide',
    trigger: 'anxiety',
  },
  sleep: {
    icon: <Moon size={18} />,
    title: 'Sleep hygiene',
    titleEs: 'Higiene del sueño',
    desc: 'Poor sleep amplifies depression and anxiety symptoms. Simple behavioral changes can significantly improve sleep quality.',
    descEs: 'El sueño deficiente amplifica los síntomas de depresión y ansiedad. Cambios conductuales simples mejoran la calidad del sueño.',
    link: 'https://www.sleepfoundation.org/sleep-hygiene',
    linkLabel: 'Sleep Foundation guide',
    trigger: 'sleep',
  },
  movement: {
    icon: <Activity size={18} />,
    title: 'Physical activity',
    titleEs: 'Actividad física',
    desc: 'Meta-analyses show 30 minutes of moderate exercise 3×/week reduces depression symptoms comparably to antidepressants in mild cases.',
    descEs: 'Los metaanálisis muestran que 30 minutos de ejercicio moderado 3 veces por semana reduce los síntomas depresivos.',
    link: 'https://www.mind.org.uk/information-support/tips-for-everyday-living/physical-activity-and-your-mental-health/',
    linkLabel: 'Mind.org — exercise and mental health',
    trigger: 'depression',
  },
  peersupport: {
    icon: <Users size={18} />,
    title: '7 Cups — free peer support',
    titleEs: '7 Cups — apoyo entre pares gratuito',
    desc: 'Anonymous, free online peer support available 24/7. Not a crisis line — designed for everyday emotional support and venting.',
    descEs: 'Apoyo emocional anónimo y gratuito disponible las 24 horas. No es una línea de crisis — es para apoyo emocional cotidiano.',
    link: 'https://www.7cups.com',
    linkLabel: '7cups.com',
    trigger: 'general',
  },
  nami: {
    icon: <Heart size={18} />,
    title: 'NAMI HelpLine',
    titleEs: 'Línea de ayuda NAMI',
    desc: 'National Alliance on Mental Illness free helpline — information, referrals, and support. Mon–Fri 10am–10pm ET. Call 1-800-950-6264 or text "NAMI" to 741741.',
    descEs: 'Línea de ayuda gratuita de la Alianza Nacional sobre Enfermedades Mentales. Lun–Vie 10am–10pm ET. Llame al 1-800-950-6264.',
    link: 'https://www.nami.org/help',
    linkLabel: 'nami.org/help',
    trigger: 'general',
  },
  psychoeducation: {
    icon: <BookOpen size={18} />,
    title: 'Understanding your mental health',
    titleEs: 'Entendiendo tu salud mental',
    desc: 'MentalHealth.gov provides science-based information about recognizing symptoms, when to seek help, and what treatment looks like.',
    descEs: 'MentalHealth.gov ofrece información basada en ciencia sobre cómo reconocer síntomas y cuándo buscar ayuda.',
    link: 'https://www.mentalhealth.gov/basics/what-is-mental-health',
    linkLabel: 'mentalhealth.gov',
    trigger: 'general',
  },
  openpath: {
    icon: <Heart size={18} />,
    title: 'Affordable therapy — Open Path Collective',
    titleEs: 'Terapia asequible — Open Path Collective',
    desc: 'Licensed therapists offering sessions at $30–$80. Useful if you want professional support but face cost barriers.',
    descEs: 'Terapeutas con licencia que ofrecen sesiones a $30–$80. Útil si quieres apoyo profesional pero enfrentas barreras económicas.',
    link: 'https://openpathcollective.org',
    linkLabel: 'openpathcollective.org',
    trigger: 'therapy',
  },
}

/**
 * Selects relevant resources based on PHQ-9 and GAD-7 scores.
 * Always includes 2 general resources + up to 2 specific ones.
 */
function selectResources(phq9Score, gad7Score) {
  const selected = []

  // Sleep: PHQ-9 item 3 correlation — if overall PHQ score suggests sleep issues
  if (phq9Score != null && phq9Score >= 3) {
    selected.push('sleep')
  }

  // Anxiety breathing: if GAD score is elevated
  if (gad7Score != null && gad7Score >= 3) {
    selected.push('breathing')
  }

  // Movement: if depression score is elevated
  if (phq9Score != null && phq9Score >= 3) {
    selected.push('movement')
  }

  // Always include peer support and psychoeducation
  selected.push('peersupport')
  selected.push('psychoeducation')

  // Add affordable therapy if any scores suggest persistent symptoms
  if ((phq9Score != null && phq9Score >= 5) || (gad7Score != null && gad7Score >= 5)) {
    selected.push('openpath')
  }

  // Add NAMI if no other clinical resources
  if (!selected.includes('openpath')) {
    selected.push('nami')
  }

  // Deduplicate and limit to 5
  return [...new Set(selected)].slice(0, 5)
}

export default function WellnessResources({ phq9Score, gad7Score }) {
  const { lang } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  const resourceKeys = selectResources(phq9Score, gad7Score)
  const visibleKeys  = expanded ? resourceKeys : resourceKeys.slice(0, 3)

  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Heart size={16} style={{ color: 'var(--low)' }} />
        <h3 className="font-semibold" style={{ color: 'var(--charcoal)' }}>
          {lang === 'es' ? 'Recursos para tu bienestar' : 'Wellness resources'}
        </h3>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
        {lang === 'es'
          ? 'Herramientas y recursos para mantener y mejorar tu bienestar mental.'
          : 'Tools and resources to maintain and strengthen your mental wellbeing.'}
      </p>

      <div className="flex flex-col gap-3">
        {visibleKeys.map(key => {
          const r = RESOURCES[key]
          if (!r) return null
          return (
            <div key={key}
              className="rounded-xl p-3 flex items-start gap-3"
              style={{ background: 'var(--sand)', border: '1px solid var(--sand-dark)' }}>
              <div className="mt-0.5" style={{ color: 'var(--sage-dark)', flexShrink: 0 }}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--charcoal)' }}>
                  {lang === 'es' ? r.titleEs : r.title}
                </div>
                <p className="text-xs mb-1.5" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                  {lang === 'es' ? r.descEs : r.desc}
                </p>
                <a href={r.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--sage-dark)' }}>
                  {r.linkLabel} <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {resourceKeys.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-xs font-medium"
          style={{ color: 'var(--muted)' }}>
          {expanded
            ? <><ChevronUp size={14} /> {lang === 'es' ? 'Mostrar menos' : 'Show less'}</>
            : <><ChevronDown size={14} /> {lang === 'es' ? 'Ver más recursos' : `${resourceKeys.length - 3} more resources`}</>
          }
        </button>
      )}

      {/* Safety disclaimer */}
      <p className="text-xs mt-4 pt-3" style={{ color: 'var(--muted)', borderTop: '1px solid var(--sand-dark)', lineHeight: 1.5 }}>
        {lang === 'es'
          ? 'Estos recursos son educativos y de apoyo entre pares. No constituyen consejo médico. Si tus síntomas persisten o empeoran, consulta a un profesional de salud mental.'
          : 'These resources are educational and peer support only. They do not constitute medical advice. If your symptoms persist or worsen, please consult a mental health professional.'}
      </p>
    </div>
  )
}
