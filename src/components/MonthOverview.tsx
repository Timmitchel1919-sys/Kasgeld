import { CalendarDays, LockKeyhole, UnlockKeyhole } from 'lucide-react'
import { months } from '../data'
import type { Participant } from '../types'

type PayoutStatus = { adminPaid: boolean; recipientConfirmed: boolean; participantId: string }
type Props = { participants: Participant[]; currentParticipantId?: string; isAdmin: boolean; payoutStatuses?: Record<string, PayoutStatus>; onAssign: (month: string, participantId: string) => void; onUnlock: (month: string) => void; onPayoutAction?: (monthId: string, action: 'mark_paid' | 'confirm_received') => void }

export function MonthOverview({ participants, currentParticipantId, isAdmin, payoutStatuses = {}, onAssign, onUnlock, onPayoutAction }: Props) {
  return <section className="panel month-panel">
    <div className="panel-title"><span className="title-icon blue"><CalendarDays size={25} /></span><div><h2>Maandoverzicht</h2><p>Toegewezen maanden zijn vergrendeld. Alleen de administrator kan ze ontgrendelen of wijzigen.</p></div><div className="legend"><span><i className="dot green" />Beschikbaar</span><span className="locked-legend"><LockKeyhole size={13} /> Toegewezen</span></div></div>
    <div className="month-grid">{months.map(month => {
      const owner = participants.find(person => person.assignedMonth === month)
      const payout = payoutStatuses[month.toLowerCase()]
      return <article className={`month-card ${owner ? 'locked' : ''}`} key={month}>
        {owner ? <LockKeyhole /> : <CalendarDays />}<div><strong>{month}</strong>{owner ? <span>{owner.name}</span> : null}</div>
        {isAdmin ? <div className="month-admin-actions"><select aria-label={`Deelnemer voor ${month}`} value={owner?.id ?? ''} onChange={event => event.target.value && onAssign(month, event.target.value)}><option value="">Toewijzen…</option>{participants.map(person => <option value={person.id} key={person.id}>{person.name}{person.assignedMonth ? ` · ${person.assignedMonth}` : ''}</option>)}</select>{owner ? <button onClick={() => onUnlock(month)} aria-label={`${month} ontgrendelen`}><UnlockKeyhole /> Ontgrendel</button> : null}{owner && onPayoutAction ? <button className="payout-action" disabled={payout?.adminPaid} onClick={() => onPayoutAction(month.toLowerCase(), 'mark_paid')}>{payout?.adminPaid ? 'Uitbetaald ✓' : 'Markeer uitbetaald'}</button> : null}</div> : <span>{owner ? <><b>{owner.initials}</b> Vergrendeld</> : <><i className="dot green" />Beschikbaar</>}</span>}
        {owner && payout?.participantId === currentParticipantId && onPayoutAction ? <button className="receipt-action" disabled={payout.recipientConfirmed} onClick={() => onPayoutAction(month.toLowerCase(), 'confirm_received')}>{payout.recipientConfirmed ? 'Ontvangst bevestigd ✓' : 'Bevestig ontvangst'}</button> : null}
      </article>
    })}</div>
  </section>
}
