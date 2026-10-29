import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { ActivityPanel } from './components/ActivityPanel'
import { AdminCenter } from './components/AdminCenter'
import { AddParticipantModal } from './components/AddParticipantModal'
import { Header } from './components/Header'
import { GroupBar } from './components/GroupBar'
import { CyclePanel } from './components/CyclePanel'
import { MonthOverview } from './components/MonthOverview'
import { MonthWheel } from './components/MonthWheel'
import { Notifications } from './components/Notifications'
import { Participants } from './components/Participants'
import { Sidebar } from './components/Sidebar'
import { initialActivities, initialParticipants, months } from './data'
import { MAIN_GROUP_ID, provisionCurrentUser, subscribeToGroup } from './firebase/realtime'
import { assignMonthOnServer, resetWheelOnServer, unlockMonthOnServer, updateNotificationsOnServer } from './firebase/adminActions'
import { readableFirebaseError } from './firebase/errors'
import { createInvitation, updateOwnPhone } from './firebase/membership'
import { enablePushNotifications, updateWhatsAppConsent } from './firebase/messaging'
import { createSpinIdempotencyKey, spinMonthAssignment } from './firebase/spinMonth'
import { createKasgeldGroup, joinKasgeldGroup, subscribeUserGroups, updateParticipantAccess, type GroupSummary } from './firebase/groupsRealtime'
import { subscribeAdminData, type InvitationRecord, type OutboxRecord } from './firebase/adminRealtime'
import { confirmPayout, downloadGroupExport, saveCycleSettings, transferOwnership, type CycleSettings } from './firebase/cycle'
import type { Activity, Participant } from './types'

const ADMIN_EMAIL = 'sheq97@gmail.com'
const loadParticipants = () => {
  try { return JSON.parse(localStorage.getItem('kasgeld-participants') || '') as Participant[] } catch { return initialParticipants }
}
const errorMessage = readableFirebaseError

export default function App() {
  const { user, configured, signOut } = useAuth()
  const [participants, setParticipants] = useState<Participant[]>(() => configured ? [] : loadParticipants())
  const [activities, setActivities] = useState<Activity[]>(() => configured ? [] : initialActivities)
  const [notifications, setNotifications] = useState(true)
  const [active, setActive] = useState('Dashboard')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [dataLoading, setDataLoading] = useState(configured)
  const [dataError, setDataError] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [activeGroupId, setActiveGroupId] = useState(MAIN_GROUP_ID)
  const [invitationRecords, setInvitationRecords] = useState<InvitationRecord[]>([])
  const [outboxRecords, setOutboxRecords] = useState<OutboxRecord[]>([])
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>({ cycleYear: new Date().getFullYear(), monthlyContributionCents: 10000, payoutDay: 6 })
  const [payoutStatuses, setPayoutStatuses] = useState<Record<string, { adminPaid: boolean; recipientConfirmed: boolean; participantId: string }>>({})
  const spinKeyRef = useRef<string | null>(null)
  const email = user?.email?.toLowerCase() || (!configured ? ADMIN_EMAIL : '')
  const activeGroup = groups.find(group => group.id === activeGroupId)
  const isAdmin = configured ? activeGroup?.role === 'owner' || activeGroup?.role === 'admin' : email === ADMIN_EMAIL
  const currentParticipant = useMemo(() => participants.find(person => person.id === user?.uid) || participants.find(person => person.email?.toLowerCase() === email) || (isAdmin ? participants[0] : undefined), [email, isAdmin, participants, user?.uid])
  const selectedMonth = currentParticipant?.assignedMonth || ''
  const displayName = user?.displayName || currentParticipant?.name || 'Deelnemer'

  useEffect(() => { if (!configured) localStorage.setItem('kasgeld-participants', JSON.stringify(participants)) }, [configured, participants])
  useEffect(() => {
    if (configured || !user?.email || participants.some(person => person.email?.toLowerCase() === user.email?.toLowerCase())) return
    const name = user.displayName?.trim() || user.email.split('@')[0]
    const participant: Participant = { id: crypto.randomUUID(), name, email: user.email, phone: 'Nog niet geregistreerd', initials: name[0]?.toUpperCase() || 'D', color: '#397889' }
    setParticipants(current => [...current, participant])
    setActivities(current => [{ id: crypto.randomUUID(), icon: 'users', title: `${name} geregistreerd`, detail: 'Automatisch toegevoegd aan Deelnemers.', time: 'Zojuist', tone: 'success' }, ...current])
  }, [configured, participants, user])
  useEffect(() => {
    if (!configured || !user?.emailVerified) return
    let cancelled = false
    let unsubscribe = () => {}
    setDataLoading(true)
    setDataError('')
    const pendingInviteCode = localStorage.getItem('kasgeld-invite-code') || ''
    void provisionCurrentUser(pendingInviteCode).then(result => {
      if (cancelled) return
      if (pendingInviteCode) localStorage.removeItem('kasgeld-invite-code')
      setActiveGroupId(result.groupId)
      unsubscribe = subscribeUserGroups(user.uid, setGroups, error => { setDataError(errorMessage(error)); setDataLoading(false) })
      setDataLoading(false)
    }).catch(error => { if (!cancelled) { setDataError(errorMessage(error)); setDataLoading(false) } })
    return () => { cancelled = true; unsubscribe() }
  }, [configured, user?.emailVerified, user?.uid])
  useEffect(() => {
    if (!configured || !activeGroupId || !groups.some(group => group.id === activeGroupId)) return
    setDataLoading(true)
    const unsubscribe = subscribeToGroup(activeGroupId, {
      onParticipants: setParticipants,
      onActivities: setActivities,
      onNotificationsEnabled: setNotifications,
      onCycleSettings: setCycleSettings,
      onPayoutStatuses: setPayoutStatuses,
      onError: error => { setDataError(errorMessage(error)); setDataLoading(false) },
    })
    setDataLoading(false)
    return unsubscribe
  }, [activeGroupId, configured, groups])
  useEffect(() => { if (!isAdmin && (active === 'Meldingen' || active === 'Instellingen')) setActive('Dashboard') }, [active, isAdmin])
  useEffect(() => {
    if (!configured || !isAdmin || !activeGroupId) { setInvitationRecords([]); setOutboxRecords([]); return }
    return subscribeAdminData(activeGroupId, setInvitationRecords, setOutboxRecords, error => setDataError(errorMessage(error)))
  }, [activeGroupId, configured, isAdmin])

  const addActivity = (title: string, detail: string, icon: Activity['icon'] = 'info') => setActivities(current => [{ id: crypto.randomUUID(), icon, title, detail, time: 'Zojuist', tone: 'success' }, ...current.slice(0, 9)])

  const spin = async () => {
    if (spinning || !currentParticipant || currentParticipant.assignedMonth) return
    if (configured) {
      setSpinning(true)
      setDataError('')
      const idempotencyKey = spinKeyRef.current || createSpinIdempotencyKey()
      spinKeyRef.current = idempotencyKey
      try {
        const result = await spinMonthAssignment(activeGroupId, currentParticipant.id, idempotencyKey)
        setRotation(current => current + 1800 + months.indexOf(result.monthLabel) * 30)
        spinKeyRef.current = null
        window.setTimeout(() => setSpinning(false), 1800)
      } catch (error) {
        setSpinning(false)
        setDataError(errorMessage(error))
      }
      return
    }
    const available = months.filter(month => !participants.some(person => person.assignedMonth === month))
    if (available.length === 0) return
    const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]
    const result = available[randomValue % available.length]
    setSpinning(true)
    setRotation(current => current + 1800 + months.indexOf(result) * 30)
    window.setTimeout(() => {
      setParticipants(current => current.map(person => person.id === currentParticipant.id ? { ...person, assignedMonth: result } : person))
      setSpinning(false)
      addActivity(`${currentParticipant.name} draaide het rad`, `${result} is toegewezen en vergrendeld.`, 'person')
    }, 1800)
  }

  const resetWheel = async () => {
    if (!isAdmin || !window.confirm('Alle toegewezen maanden ontgrendelen en het rad resetten?')) return
    if (configured) {
      setDataError('')
      try { await resetWheelOnServer(activeGroupId); setRotation(0) } catch (error) { setDataError(errorMessage(error)) }
      return
    }
    setParticipants(current => current.map(person => ({ ...person, assignedMonth: undefined })))
    setRotation(0)
    addActivity('Maandrad gereset', 'Alle maanden zijn door de administrator ontgrendeld.', 'lock')
  }

  const assignMonth = async (month: string, participantId: string) => {
    if (!isAdmin) return
    if (configured) {
      setDataError('')
      try { await assignMonthOnServer(activeGroupId, month.toLowerCase(), participantId) } catch (error) { setDataError(errorMessage(error)) }
      return
    }
    setParticipants(current => {
      const target = current.find(person => person.id === participantId)
      const occupant = current.find(person => person.assignedMonth === month)
      if (!target) return current
      const previousMonth = target.assignedMonth
      return current.map(person => {
        if (person.id === target.id) return { ...person, assignedMonth: month }
        if (occupant && person.id === occupant.id) return { ...person, assignedMonth: previousMonth }
        return person
      })
    })
    addActivity('Maand handmatig gewijzigd', `${month} is door de administrator opnieuw toegewezen.`, 'lock')
  }

  const unlockMonth = async (month: string) => {
    if (!isAdmin) return
    if (configured) {
      setDataError('')
      try { await unlockMonthOnServer(activeGroupId, month.toLowerCase()) } catch (error) { setDataError(errorMessage(error)) }
      return
    }
    setParticipants(current => current.map(person => person.assignedMonth === month ? { ...person, assignedMonth: undefined } : person))
    addActivity(`${month} ontgrendeld`, 'De maand is opnieuw beschikbaar gemaakt.', 'lock')
  }

  const addParticipant = (name: string, phone: string) => {
    if (!isAdmin) return
    if (configured) { setDataError('Deelnemers worden nu automatisch toegevoegd wanneer zij registreren en inloggen.'); setModalOpen(false); return }
    setParticipants(current => [...current, { id: crypto.randomUUID(), name, phone, initials: name[0]?.toUpperCase() || 'D', color: '#397889' }])
    addActivity(`${name} toegevoegd`, 'Deelnemer succesvol geregistreerd.', 'users')
    setModalOpen(false)
  }

  const savePhone = async (phone: string) => {
    if (!configured) {
      if (currentParticipant) setParticipants(current => current.map(person => person.id === currentParticipant.id ? { ...person, phone } : person))
      return
    }
    setDataError('')
    try { await updateOwnPhone(activeGroupId, phone) } catch (error) { setDataError(errorMessage(error)) }
  }

  const generateInvitation = async () => {
    if (!configured || !isAdmin) return
    setDataError('')
    try {
      const result = await createInvitation(activeGroupId)
      setInviteCode(result.code)
      await navigator.clipboard?.writeText(result.code).catch(() => undefined)
    } catch (error) { setDataError(errorMessage(error)) }
  }

  const enablePush = async () => {
    setDataError('')
    try { await enablePushNotifications(activeGroupId) } catch (error) { setDataError(errorMessage(error)) }
  }

  const toggleWhatsApp = async (enabled: boolean) => {
    if (!configured) {
      if (currentParticipant) setParticipants(current => current.map(person => person.id === currentParticipant.id ? { ...person, whatsappOptIn: enabled } : person))
      return
    }
    setDataError('')
    try { await updateWhatsAppConsent(activeGroupId, enabled) } catch (error) { setDataError(errorMessage(error)) }
  }

  const createGroup = async (name: string) => {
    setDataError('')
    try { const result = await createKasgeldGroup(name); setActiveGroupId(result.groupId) } catch (error) { setDataError(errorMessage(error)) }
  }

  const joinGroup = async (code: string) => {
    setDataError('')
    try { const result = await joinKasgeldGroup(code); setActiveGroupId(result.groupId) } catch (error) { setDataError(errorMessage(error)) }
  }

  const changeParticipantAccess = async (participantId: string, role: 'admin' | 'member', status: 'active' | 'inactive') => {
    setDataError('')
    try { await updateParticipantAccess(activeGroupId, participantId, role, status) } catch (error) { setDataError(errorMessage(error)) }
  }

  const payoutAction = async (monthId: string, action: 'mark_paid' | 'confirm_received') => {
    setDataError('')
    try { await confirmPayout(activeGroupId, monthId, action) } catch (error) { setDataError(errorMessage(error)) }
  }

  const saveCycle = async (settings: CycleSettings) => {
    setDataError('')
    try { await saveCycleSettings(activeGroupId, settings) } catch (error) { setDataError(errorMessage(error)) }
  }

  const transferGroup = async (participantId: string) => {
    setDataError('')
    try { await transferOwnership(activeGroupId, participantId) } catch (error) { setDataError(errorMessage(error)) }
  }

  return <div className="app-shell">
    <Header onMenuToggle={() => setMenuOpen(value => !value)} />
    <Sidebar active={active} isAdmin={isAdmin} open={menuOpen} profileOpen={profileOpen} displayName={displayName} email={email} phone={currentParticipant?.phone || ''} whatsappOptIn={currentParticipant?.whatsappOptIn === true} onNavigate={setActive} onClose={() => setMenuOpen(false)} onProfileToggle={() => setProfileOpen(value => !value)} onSignOut={() => void signOut()} onSavePhone={phone => void savePhone(phone)} onEnablePush={() => void enablePush()} onToggleWhatsApp={enabled => void toggleWhatsApp(enabled)} />
    <main className="app-content">
      {configured ? <GroupBar groups={groups} activeGroupId={activeGroupId} onSelect={setActiveGroupId} onCreate={name => void createGroup(name)} onJoin={code => void joinGroup(code)} /> : null}
      {dataLoading ? <div className="data-status" role="status">Groepsgegevens laden…</div> : null}
      {dataError ? <div className="data-status data-status-error" role="alert">{dataError}</div> : null}
      {active === 'Dashboard' ? <div className="dashboard-page"><MonthWheel rotation={rotation} spinning={spinning} selectedMonth={selectedMonth} selectedName={currentParticipant?.name || displayName} onSpin={spin} onReset={resetWheel} canSpin={Boolean(currentParticipant && !currentParticipant.assignedMonth)} isAdmin={isAdmin} /><MonthOverview participants={participants} currentParticipantId={currentParticipant?.id} isAdmin={isAdmin} payoutStatuses={payoutStatuses} onAssign={assignMonth} onUnlock={unlockMonth} onPayoutAction={(monthId, action) => void payoutAction(monthId, action)} /></div> : null}
      {active === 'Deelnemers' ? <Participants participants={participants} onAdd={() => setModalOpen(true)} isAdmin={isAdmin} isOwner={activeGroup?.role === 'owner'} onAccessChange={(id, role, status) => void changeParticipantAccess(id, role, status)} /> : null}
      {active === 'Meldingen' && isAdmin ? <ActivityPanel activities={activities} /> : null}
      {active === 'Instellingen' && isAdmin ? <><Notifications enabled={notifications} inviteCode={inviteCode} onCreateInvitation={() => void generateInvitation()} onToggle={() => {
        if (!configured) { setNotifications(value => !value); return }
        setDataError('')
        void updateNotificationsOnServer(activeGroupId, !notifications).catch(error => setDataError(errorMessage(error)))
      }} /><CyclePanel settings={cycleSettings} participants={participants} isOwner={activeGroup?.role === 'owner'} onSave={settings => void saveCycle(settings)} onTransfer={id => void transferGroup(id)} onExport={() => void downloadGroupExport(activeGroupId).catch(error => setDataError(errorMessage(error)))} /><AdminCenter invitations={invitationRecords} outbox={outboxRecords} /></> : null}
    </main>
    <AddParticipantModal open={modalOpen && isAdmin} onClose={() => setModalOpen(false)} onSubmit={addParticipant} />
  </div>
}
