import { Bell, BellRing, ChevronUp, Home, LogOut, MessageCircle, PanelLeftClose, Save, Settings, UserRound, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from './Header'

type SidebarProps = {
  active: string
  isAdmin: boolean
  collapsed: boolean
  profileOpen: boolean
  displayName: string
  email: string
  phone: string
  whatsappOptIn: boolean
  onNavigate: (item: string) => void
  onToggle: () => void
  onProfileToggle: () => void
  onSignOut: () => void
  onSavePhone: (phone: string) => void
  onEnablePush: () => void
  onToggleWhatsApp: (enabled: boolean) => void
}
const navigation = [
  { label: 'Dashboard', icon: Home, adminOnly: false },
  { label: 'Deelnemers', icon: Users, adminOnly: false },
  { label: 'Meldingen', icon: Bell, adminOnly: true },
  { label: 'Instellingen', icon: Settings, adminOnly: true },
]

export function Sidebar({ active, isAdmin, collapsed, profileOpen, displayName, email, phone, whatsappOptIn, onNavigate, onToggle, onProfileToggle, onSignOut, onSavePhone, onEnablePush, onToggleWhatsApp }: SidebarProps) {
  const [phoneDraft, setPhoneDraft] = useState(phone)
  useEffect(() => setPhoneDraft(phone), [phone])
  return <>
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand"><button className="sidebar-logo-button" aria-label={collapsed ? 'Sidebar openen' : 'Kasgeld'} onClick={() => collapsed && onToggle()}><Logo /></button><h1>Kasgeld</h1><button className="sidebar-collapse" aria-label="Sidebar inklappen" onClick={onToggle}><PanelLeftClose /></button></div>
      <nav aria-label="Hoofdnavigatie">{navigation.filter(item => isAdmin || !item.adminOnly).map(({ label, icon: Icon }) => <button className={active === label ? 'active' : ''} onClick={() => onNavigate(label)} key={label}><Icon /><span>{label}</span></button>)}</nav>
      <div className="sidebar-profile">
        {profileOpen ? <section className="profile-panel" aria-label="Mijn profiel"><span className="profile-avatar"><UserRound /></span><div><strong>{displayName}</strong><small>{email}</small><em>{isAdmin ? 'Administrator' : 'Deelnemer'}</em></div><label className="profile-phone"><span>Mobiel nummer</span><input value={phoneDraft} onChange={event => setPhoneDraft(event.target.value)} placeholder="+5978123456" /><button onClick={() => onSavePhone(phoneDraft)} aria-label="Mobiel nummer opslaan"><Save /> Opslaan</button></label><label className="profile-consent"><input type="checkbox" checked={whatsappOptIn} onChange={event => onToggleWhatsApp(event.target.checked)} /><MessageCircle /><span>Ik geef toestemming voor WhatsApp-herinneringen.</span></label><button className="profile-push" onClick={onEnablePush}><BellRing /> PWA-push inschakelen</button><button className="profile-signout" onClick={onSignOut}><LogOut /> Uitloggen</button></section> : null}
        <button className="profile-trigger" aria-expanded={profileOpen} onClick={onProfileToggle}><span className="profile-avatar"><UserRound /></span><span><strong>Mijn profiel</strong><small>{displayName}</small></span><ChevronUp className={profileOpen ? 'rotated' : ''} /></button>
      </div>
    </aside>
    {!collapsed ? <button className="sidebar-scrim" aria-label="Sidebar-overlay sluiten" onClick={onToggle} /> : null}
  </>
}
