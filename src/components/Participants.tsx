import { Check, Ellipsis, LockKeyhole, Phone, Plus, Users } from 'lucide-react'
import type { Participant } from '../types'

type ParticipantsProps = { participants: Participant[]; onAdd: () => void }

export function Avatar({ participant, small = false }: { participant: Participant, small?: boolean }) {
  return <span className={`avatar ${small ? 'small' : ''}`} style={{ background: participant.color }}>{participant.initials}</span>
}

export function Participants({ participants, onAdd }: ParticipantsProps) {
  return (
    <section className="panel participants-panel">
      <div className="panel-title participant-heading">
        <span className="title-icon blue"><Users size={25} /></span>
        <div><h2>Deelnemers</h2><p>Alle deelnemers moeten een mobiel nummer registreren.</p></div>
        <button className="primary-button" onClick={onAdd}><Plus size={20} /> Deelnemer toevoegen</button>
      </div>
      <div className="table-scroll"><table><thead><tr><th>#</th><th>Naam</th><th>Mobiel nummer</th><th>Status</th><th>Toegewezen maand</th><th /></tr></thead>
        <tbody>{participants.map((person, index) => <tr key={person.id}>
          <td>{index + 1}</td><td><span className="person-cell"><Avatar participant={person} small /><strong>{person.name}</strong></span></td><td>{person.phone}</td>
          <td><span className="status"><Check size={14} /> Geregistreerd</span></td>
          <td>{person.assignedMonth ? <span className="month-lock"><LockKeyhole size={13} />{person.assignedMonth}</span> : '-'}</td><td><button className="more" aria-label={`Meer opties voor ${person.name}`}><Ellipsis /></button></td>
        </tr>)}</tbody>
      </table></div>
      <div className="phone-note"><Phone /><p><strong>Mobiel nummer verplicht</strong><br />Alle deelnemers moeten een geldig mobiel nummer registreren voor het ontvangen van meldingen.</p></div>
    </section>
  )
}
