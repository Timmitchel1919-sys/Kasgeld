import { FormEvent, useEffect, useState } from 'react'
import { CalendarClock, Download, ShieldCheck } from 'lucide-react'
import type { CycleSettings } from '../firebase/cycle'
import type { Participant } from '../types'

type Props = { settings: CycleSettings; participants: Participant[]; isOwner: boolean; onSave: (settings: CycleSettings) => void; onTransfer: (participantId: string) => void; onExport: () => void }

export function CyclePanel({ settings, participants, isOwner, onSave, onTransfer, onExport }: Props) {
  const [draft, setDraft] = useState(settings)
  const [newOwner, setNewOwner] = useState('')
  useEffect(() => setDraft(settings), [settings])
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(draft) }
  return <section className="cycle-grid">
    <article className="panel cycle-panel"><div className="panel-title"><span className="title-icon blue"><CalendarClock /></span><div><h2>Kasgeldronde</h2><p>Leg afspraken vast; Kasgeld verplaatst zelf geen geld.</p></div></div><form onSubmit={submit}><label>Jaar<input type="number" min="2020" max="2100" value={draft.cycleYear} onChange={event => setDraft({ ...draft, cycleYear: Number(event.target.value) })} /></label><label>Bijdrage per maand (€)<input type="number" min="0.01" step="0.01" value={(draft.monthlyContributionCents / 100).toFixed(2)} onChange={event => setDraft({ ...draft, monthlyContributionCents: Math.round(Number(event.target.value) * 100) })} /></label><label>Uitbetalingsdag<input type="number" min="1" max="28" value={draft.payoutDay} onChange={event => setDraft({ ...draft, payoutDay: Number(event.target.value) })} /></label><button className="primary-button">Ronde opslaan</button></form></article>
    <article className="panel ownership-panel"><div className="panel-title"><span className="title-icon blue"><ShieldCheck /></span><div><h2>Eigendom en export</h2><p>Overdracht is atomair en wordt gelogd.</p></div></div>{isOwner ? <div className="ownership-actions"><select aria-label="Nieuwe eigenaar" value={newOwner} onChange={event => setNewOwner(event.target.value)}><option value="">Kies actief lid…</option>{participants.filter(person => person.role !== 'owner' && person.memberStatus !== 'inactive').map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select><button disabled={!newOwner} onClick={() => newOwner && window.confirm('Eigendom definitief overdragen?') && onTransfer(newOwner)}>Eigendom overdragen</button></div> : null}<button className="export-button" onClick={onExport}><Download /> Download JSON-export</button></article>
  </section>
}
