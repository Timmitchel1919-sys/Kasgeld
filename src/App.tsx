import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { MonthWheel } from './components/MonthWheel'
import { MonthOverview } from './components/MonthOverview'
import { Participants } from './components/Participants'
import { ActivityPanel } from './components/ActivityPanel'
import { Notifications } from './components/Notifications'
import { AddParticipantModal } from './components/AddParticipantModal'
import { initialActivities, initialParticipants } from './data'
import type { Activity, Participant } from './types'

const loadParticipants = () => {
  try { return JSON.parse(localStorage.getItem('kasgeld-participants') || '') as Participant[] } catch { return initialParticipants }
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>(loadParticipants)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [notifications, setNotifications] = useState(true)
  const [active, setActive] = useState('Dashboard')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const selectedName = useMemo(() => participants.find(p => p.assignedMonth === 'April')?.name || 'Shaquil', [participants])
  useEffect(() => localStorage.setItem('kasgeld-participants', JSON.stringify(participants)), [participants])

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setRotation(current => current + 1800)
    window.setTimeout(() => {
      setSpinning(false)
      setActivities(current => [{ id: Date.now(), icon: 'person', title: `${selectedName} draaide het rad`, detail: 'April blijft geregistreerd', time: 'Zojuist', tone: 'success' }, ...current.slice(0, 3)])
    }, 1800)
  }

  const addParticipant = (name: string, phone: string) => {
    const next: Participant = { id: Date.now(), name, phone, initials: name.slice(0, 1).toUpperCase(), color: '#397889' }
    setParticipants(current => [...current, next])
    setActivities(current => [{ id: Date.now(), icon: 'users', title: `${name} toegevoegd`, detail: 'Deelnemer succesvol geregistreerd.', time: 'Zojuist', tone: 'success' }, ...current.slice(0, 3)])
    setModalOpen(false)
  }

  return <>
    <Header active={active} onNavigate={setActive} />
    <main className="dashboard" data-active-section={active}>
      <MonthWheel rotation={rotation} spinning={spinning} selectedMonth="April" selectedName={selectedName} onSpin={spin} />
      <div className="center-column"><MonthOverview /><Participants participants={participants} onAdd={() => setModalOpen(true)} /></div>
      <div className="right-column"><ActivityPanel activities={activities} /><Notifications enabled={notifications} onToggle={() => setNotifications(value => !value)} /></div>
    </main>
    <AddParticipantModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={addParticipant} />
  </>
}
