import { Ban, KeyRound, RefreshCw, Send, ShieldCheck } from 'lucide-react'
import type { InvitationRecord, OutboxRecord } from '../firebase/adminRealtime'

type Props = { invitations: InvitationRecord[]; outbox: OutboxRecord[]; onRevokeInvitation: (id: string) => void; onRetryNotification: (id: string) => void; onCancelNotification: (id: string) => void }

export function AdminCenter({ invitations, outbox, onRevokeInvitation, onRetryNotification, onCancelNotification }: Props) {
  const activeInvitations = invitations.filter(item => item.status === 'active').length
  const failedMessages = outbox.filter(item => ['failed', 'failed_no_channel', 'pending_provider'].includes(item.status)).length
  const sentMessages = outbox.filter(item => item.status === 'sent').length
  return <section className="admin-center">
    <div className="operations-summary"><span><ShieldCheck />{activeInvitations}<small>actieve uitnodigingen</small></span><span><Send />{sentMessages}<small>verzonden berichten</small></span><span className={failedMessages ? 'warning' : ''}><Ban />{failedMessages}<small>aandacht vereist</small></span></div>
    <article className="panel"><div className="panel-title"><span className="title-icon blue"><KeyRound /></span><div><h2>Uitnodigingen</h2><p>Actieve toegangscodes kunnen direct worden ingetrokken.</p></div></div><div className="admin-list">{invitations.length ? invitations.map(item => <div key={item.id}><div><strong>{item.status === 'active' ? 'Actief' : item.status === 'used' ? 'Gebruikt' : item.status === 'revoked' ? 'Ingetrokken' : item.status}</strong><span>{item.expiresAt ? `Verloopt: ${item.expiresAt}` : 'Geen vervaldatum'}</span></div>{item.status === 'active' ? <button className="admin-danger" onClick={() => window.confirm('Deze uitnodiging intrekken?') && onRevokeInvitation(item.id)}><Ban /> Intrekken</button> : null}</div>) : <p>Nog geen uitnodigingen.</p>}</div></article>
    <article className="panel"><div className="panel-title"><span className="title-icon blue"><Send /></span><div><h2>Berichten-outbox</h2><p>Herstel alleen mislukte berichten; verzonden berichten blijven definitief.</p></div></div><div className="admin-list">{outbox.length ? outbox.map(item => <div key={item.id}><div><strong>{item.participantName} · {item.monthLabel}</strong><span>{item.period} · {item.channel} · {item.status}</span></div><div className="outbox-actions">{['failed', 'failed_no_channel', 'pending_provider'].includes(item.status) ? <button onClick={() => onRetryNotification(item.id)}><RefreshCw /> Opnieuw</button> : null}{['queued', 'pending_provider', 'failed', 'failed_no_channel'].includes(item.status) ? <button className="admin-danger" onClick={() => onCancelNotification(item.id)}><Ban /> Annuleren</button> : null}</div></div>) : <p>Nog geen geplande berichten.</p>}</div></article>
  </section>
}
