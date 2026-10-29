import { Check, Ellipsis, LockKeyhole, Phone, Plus, Users } from 'lucide-react'
import type { Participant } from '../types'

type ParticipantsProps = { participants: Participant[]; onAdd: () => void; isAdmin: boolean; isOwner?: boolean; onAccessChange?: (id: string, role: 'admin' | 'member', status: 'active' | 'inactive') => void }

export function Avatar({ participant, small = false }: { participant: Participant, small?: boolean }) {
  return <span className={`avatar ${small ? 'small' : ''}`} style={{ background: participant.color }}>{participant.initials}</span>
}

export function Participants({ participants, onAdd, isAdmin, isOwner = false, onAccessChange }: ParticipantsProps) {
  return (
    <section className="panel participants-panel">
      <div className="panel-title participant-heading">
        <span className="title-icon blue"><Users size={25} /></span>
        <div><h2>Deelnemers</h2><p>Iedere gebruiker die zich aanmeldt of registreert, verschijnt automatisch in deze module.</p></div>
        {isAdmin ? <button className="primary-button" onClick={onAdd}><Plus size={20} /> Deelnemer toevoegen</button> : null}
      </div>
      <div className="table-scroll"><table><thead><tr><th>#</th><th>Naam</th><th>Mobiel nummer</th><th>Status</th><th>Toegewezen maand</th><th /></tr></thead>
        <tbody>{participants.map((person, index) => <tr key={person.id}>
          <td>{index + 1}</td><td><span className="person-cell"><Avatar participant={person} small /><strong>{person.name}</strong></span></td><td>{person.phone}</td>
          <td><span className={`status ${person.memberStatus === 'inactive' ? 'inactive' : ''}`}><Check size={14} /> {person.memberStatus === 'inactive' ? 'Inactief' : person.role === 'owner' ? 'Eigenaar' : person.role === 'admin' ? 'Beheerder' : 'Geregistreerd'}</span></td>
          <td>{person.assignedMonth ? <span className="month-lock"><LockKeyhole size={13} />{person.assignedMonth}</span> : '-'}</td><td>{isOwner && person.role !== 'owner' && onAccessChange ? <div className="access-actions"><select aria-label={`Rol van ${person.name}`} value={person.role || 'member'} onChange={event => onAccessChange(person.id, event.target.value as 'admin' | 'member', person.memberStatus || 'active')}><option value="member">Lid</option><option value="admin">Beheerder</option></select><button className="more" aria-label={`${person.memberStatus === 'inactive' ? 'Activeren' : 'Deactiveren'} ${person.name}`} onClick={() => onAccessChange(person.id, person.role === 'admin' ? 'admin' : 'member', person.memberStatus === 'inactive' ? 'active' : 'inactive')}><Ellipsis /></button></div> : isAdmin ? <button className="more" aria-label={`Meer opties voor ${person.name}`}><Ellipsis /></button> : null}</td>
        </tr>)}</tbody>
      </table></div>
      <div className="phone-note"><Phone /><p><strong>Mobiel nummer verplicht</strong><br />Alle deelnemers moeten een geldig mobiel nummer registreren voor het ontvangen van meldingen.</p></div>
    </section>
  )
}
