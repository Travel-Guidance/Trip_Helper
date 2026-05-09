import { useEffect, useState } from 'react'
import '../styles/AiGenerationInputForm.css'
import AiGenerationInputFormView from '../components/aitravel/AiGenerationInputFormView'
import { initAiGenerationInputForm } from '../utils/AiGenerationInputForm'

export default function AiGenerationInputForm() {
  const [openCalendar, setOpenCalendar] = useState(null)
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [tomorrow] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))

  const applyDate = (field, value) => {
    setDates(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'startDate' && next.endDate && next.endDate <= value) {
        next.endDate = ''
      }
      return next
    })

    const input = document.getElementById(field)
    if (input) {
      input.value = value
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }

    if (field === 'startDate') {
      const endInput = document.getElementById('endDate')
      if (endInput && dates.endDate && dates.endDate <= value) {
        endInput.value = ''
        endInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  useEffect(() => initAiGenerationInputForm(), [])

  return <AiGenerationInputFormView openCalendar={openCalendar} setOpenCalendar={setOpenCalendar} dates={dates} tomorrow={tomorrow} applyDate={applyDate} />
}