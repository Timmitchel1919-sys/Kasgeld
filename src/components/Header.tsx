import { Bell, ChevronDown, Home, Settings, Users } from 'lucide-react'

type HeaderProps = {
  active: string
  onNavigate: (item: string) => void
}

const nav = [
  { label: 'Dashboard', icon: Home },
  { label: 'Deelnemers', icon: Users },
  { label: 'Instellingen', icon: Settings },
  { label: 'Meldingen', icon: Bell },
]

export function Header({ active, onNavigate }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="coin-logo" aria-hidden="true"><span>€</span><i>€</i><b>€</b></div>
        <div><h1>Kasgeld Applicatie</h1><p>Maandverdeling, deelnemersregistratie en automatische meldingen</p></div>
      </div>
      <nav className="main-nav" aria-label="Hoofdnavigatie">
        {nav.map(({ label, icon: Icon }) => (
          <button className={active === label ? 'active' : ''} onClick={() => onNavigate(label)} key={label}>
            <Icon size={22} strokeWidth={2.7} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="group-menu" aria-label="Groepsmenu">
        <span className="group-avatar"><Users size={25} /></span>
        <span><strong>Kasgeld Groep</strong><small>Samen sterker</small></span>
        <ChevronDown size={18} />
      </button>
    </header>
  )
}
