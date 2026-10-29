import { Bell, CalendarDays, Copy, KeyRound, MessageCircle } from 'lucide-react'

export function Notifications({ enabled, inviteCode, onToggle, onCreateInvitation }: { enabled: boolean; inviteCode: string; onToggle: () => void; onCreateInvitation: () => void }) {
  return (
    <section className="panel notification-panel">
      <div className="panel-title"><span className="title-icon blue"><Bell size={25} /></span><div><h2>Automatische meldingen</h2><p>Deelnemers krijgen automatisch een herinnering.</p></div><button className={`toggle ${enabled ? 'on' : ''}`} onClick={onToggle} role="switch" aria-checked={enabled}><i /><span>{enabled ? 'Actief' : 'Uit'}</span></button></div>
      <div className="notification-rule"><CalendarDays /><div><strong>Melding op de 6e van de volgende maand</strong><p>WhatsApp is het primaire kanaal. Als WhatsApp niet beschikbaar is of faalt, gebruikt Kasgeld een gratis PWA-pushmelding.</p></div></div>
      <div className="invitation-rule"><KeyRound /><div><strong>Besloten toegang</strong><p>Maak een eenmalige uitnodigingscode. De code verloopt na zeven dagen.</p>{inviteCode ? <code>{inviteCode}</code> : null}</div><button className="primary-button" onClick={onCreateInvitation}>{inviteCode ? <><Copy size={18} /> Nieuwe code</> : 'Code maken'}</button></div>
      <div className="message-example"><span className="avatar" style={{ background: '#8d4d21' }}>S</span><div><small>Voorbeeld: Shaquil</small><strong>Shaquil ontvangt kasgeld in april</strong><p>WhatsApp op 6 mei, met PWA-push als fallback.</p></div></div>
      <div className="phones">
        <div className="phone"><div className="notch" /><header><span className="wa"><MessageCircle /></span> WhatsApp <time>nu</time></header><div className="bubble">Beste Shaquil,<br />je kasgeld-uitbetaling<br />staat gepland op 6 mei.<br />Groet,<br />Kasgeld Applicatie <small>14:26</small></div></div>
        <div className="phone"><div className="notch" /><header><span className="sms">●</span> Kasgeld push <time>nu</time></header><div className="bubble">Kasgeld herinnering<br />Shaquil, je uitbetaling<br />voor april staat gepland.<br /><small>14:26</small></div></div>
      </div>
    </section>
  )
}
