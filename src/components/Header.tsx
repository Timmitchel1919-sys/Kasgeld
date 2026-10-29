import { Menu } from 'lucide-react'

type HeaderProps = { onMenuToggle: () => void }

export function Logo() {
  return <div className="coin-logo" aria-hidden="true"><span>€</span><i>€</i><b>€</b></div>
}

export function Header({ onMenuToggle }: HeaderProps) {
  return <header className="topbar">
    <div className="topbar-logo"><Logo /></div>
    <h1>Kasgeld</h1>
    <button className="mobile-menu" aria-label="Menu openen" onClick={onMenuToggle}><Menu /></button>
  </header>
}
