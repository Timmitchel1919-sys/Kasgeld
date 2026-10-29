import { Bell, CalendarDays, MessageCircle } from 'lucide-react'

export function Notifications({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <section className="panel notification-panel">
      <div className="panel-title"><span className="title-icon blue"><Bell size={25} /></span><div><h2>Automatische meldingen</h2><p>Deelnemers krijgen automatisch een herinnering.</p></div><button className={`toggle ${enabled ? 'on' : ''}`} onClick={onToggle} role="switch" aria-checked={enabled}><i /><span>{enabled ? 'Actief' : 'Uit'}</span></button></div>
      <div className="notification-rule"><CalendarDays /><div><strong>Melding op de 6e van de volgende maand</strong><p>De deelnemer die een maand heeft, ontvangt op de 6e van de volgende maand een WhatsApp-bericht of sms.</p></div></div>
      <div className="message-example"><span className="avatar" style={{ background: '#8d4d21' }}>S</span><div><small>Voorbeeld: Shaquil</small><strong>Shaquil ontvangt kasgeld in april</strong><p>Herinnering op 6 mei via WhatsApp of sms.</p></div></div>
      <div className="phones">
        <div className="phone"><div className="notch" /><header><span className="wa"><MessageCircle /></span> WhatsApp <time>nu</time></header><div className="bubble">Beste Shaquil,<br />je kasgeld-uitbetaling<br />staat gepland op 6 mei.<br />Groet,<br />Kasgeld Applicatie <small>14:26</small></div></div>
        <div className="phone"><div className="notch" /><header><span className="sms">●</span> SMS <time>nu</time></header><div className="bubble">Beste Shaquil,<br />je kasgeld-uitbetaling<br />staat gepland op 6 mei.<br />Groet,<br />Kasgeld Applicatie <small>14:26</small></div></div>
      </div>
    </section>
  )
}
