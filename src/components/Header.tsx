import { Menu } from 'lucide-react'

type HeaderProps = { onMenuToggle: () => void }

export function Logo() {
  return <img className="kasgeld-logo" src="/kasgeld-logo.png" alt="" aria-hidden="true" />
}

export function Header({ onMenuToggle }: HeaderProps) {
  return <header className="topbar">
    <div className="topbar-logo"><Logo /></div>
    <h1>Kasgeld</h1>
    <button className="mobile-menu" aria-label="Menu openen" onClick={onMenuToggle}><Menu /></button>
  </header>
}
