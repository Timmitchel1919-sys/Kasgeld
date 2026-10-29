import { ArrowRight, CalendarCheck, CheckCircle2, Eye, LockKeyhole, MailCheck, Settings, ShieldCheck, UserPlus, Users, WalletCards } from 'lucide-react'
import { Logo } from '../components/Header'

type LandingPageProps = { onLogin: () => void; onRegister: () => void }

const steps = [
  { icon: Users, title: 'Maak een groep', text: 'Breng vrienden, collega’s of familie samen in één overzichtelijke kasgeldgroep.' },
  { icon: UserPlus, title: 'Registreer deelnemers', text: 'Iedere deelnemer maakt een eigen account en verschijnt automatisch in het deelnemersoverzicht.' },
  { icon: WalletCards, title: 'Draai één keer', text: 'Iedere deelnemer draait één keer en krijgt direct een beschikbare maand toegewezen.' },
]

const benefits = [
  { icon: Eye, title: 'Transparante maandverdeling', text: 'Beschikbare en toegewezen maanden zijn voor iedere deelnemer duidelijk zichtbaar.' },
  { icon: CalendarCheck, title: 'Iedereen weet waar hij aan toe is', text: 'Na het draaien blijft de toegewezen maand vergrendeld en altijd terug te vinden.' },
  { icon: Settings, title: 'Beheer door één administrator', text: 'Alleen de administrator kan instellingen, deelnemers en uitzonderlijke maandwissels beheren.' },
]

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return <div className="landing-page">
    <header className="landing-header">
      <a className="landing-brand" href="#top" aria-label="Kasgeld home"><Logo /><strong>Kasgeld</strong></a>
      <nav aria-label="Landingspagina navigatie"><a href="#werking">Hoe het werkt</a><a href="#voordelen">Voordelen</a><a href="#veiligheid">Veiligheid</a></nav>
      <div className="landing-header-actions"><button className="landing-button secondary" onClick={onLogin}>Inloggen</button><button className="landing-button primary" onClick={onRegister}>Gratis starten</button></div>
    </header>

    <main id="top">
      <section className="landing-hero">
        <div className="landing-hero-copy"><h1>Samen sparen.<br /><span>Eerlijk verdelen.</span></h1><p>Beheer de maandverdeling van jullie kasgeldgroep eenvoudig en transparant. Iedereen draait één keer en ziet altijd wanneer hij of zij aan de beurt is.</p><div className="landing-hero-actions"><button className="landing-button primary large" onClick={onRegister}>Start je kasgeldgroep <ArrowRight /></button><button className="landing-button secondary large" onClick={onLogin}>Ik heb al een account</button></div><div className="landing-proof"><CheckCircle2 /> Persoonlijk beheer voor vrienden, collega’s en familie</div></div>
        <div className="landing-product" aria-label="Voorbeeld van het Kasgeld-dashboard"><div className="laptop-screen"><img src="/landing-dashboard.png" alt="Kasgeld dashboard met maandrad en maandoverzicht" /></div><div className="laptop-base" /></div>
      </section>

      <section className="landing-how" id="werking"><h2>Zo werkt het</h2><div className="landing-steps">{steps.map(({ icon: Icon, title, text }, index) => <article key={title}><span className="step-number">{index + 1}</span><span className="step-icon"><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="landing-benefits" id="voordelen"><h2>De voordelen van Kasgeld</h2><div>{benefits.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

      <section className="landing-security" id="veiligheid"><h2>Veilig en betrouwbaar ingericht</h2><div><article><MailCheck /><h3>Geverifieerde accounts</h3><p>Deelnemers verifiëren hun e-mailadres voordat ze toegang krijgen.</p></article><article><LockKeyhole /><h3>Toegewezen maanden staan vast</h3><p>Na het draaien kan een deelnemer zijn maand niet zelf veranderen.</p></article><article><ShieldCheck /><h3>Administrator beheert wijzigingen</h3><p>Beheerfuncties en instellingen zijn uitsluitend zichtbaar voor de administrator.</p></article></div></section>

      <section className="landing-final"><h2>Klaar om eerlijk te verdelen?</h2><p>Maak je account en start jullie overzichtelijke maandverdeling.</p><button className="landing-button light large" onClick={onRegister}>Maak gratis je account <ArrowRight /></button></section>
    </main>

    <footer className="landing-footer"><a className="landing-brand" href="#top"><Logo /><strong>Kasgeld</strong></a><div><a href="#veiligheid">Privacy</a><a href="#veiligheid">Voorwaarden</a><a href="mailto:sheq97@gmail.com">Contact</a></div></footer>
  </div>
}
