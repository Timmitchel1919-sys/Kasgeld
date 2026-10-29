import { KeyRound, Send } from 'lucide-react'
import type { InvitationRecord, OutboxRecord } from '../firebase/adminRealtime'

export function AdminCenter({ invitations, outbox }: { invitations: InvitationRecord[]; outbox: OutboxRecord[] }) {
  return <section className="admin-center">
    <article className="panel"><div className="panel-title"><span className="title-icon blue"><KeyRound /></span><div><h2>Uitnodigingen</h2><p>Server-side statussen; ruwe codes worden nooit opgeslagen.</p></div></div><div className="admin-list">{invitations.length ? invitations.map(item => <div key={item.id}><strong>{item.status === 'active' ? 'Actief' : item.status === 'used' ? 'Gebruikt' : item.status}</strong><span>{item.expiresAt ? `Verloopt: ${item.expiresAt}` : 'Geen vervaldatum'}</span></div>) : <p>Nog geen uitnodigingen.</p>}</div></article>
    <article className="panel"><div className="panel-title"><span className="title-icon blue"><Send /></span><div><h2>Berichten-outbox</h2><p>WhatsApp is primair; PWA-push is fallback.</p></div></div><div className="admin-list">{outbox.length ? outbox.map(item => <div key={item.id}><strong>{item.participantName} · {item.monthLabel}</strong><span>{item.period} · {item.channel} · {item.status}</span></div>) : <p>Nog geen geplande berichten.</p>}</div></article>
  </section>
}
