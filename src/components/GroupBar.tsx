import { FormEvent, useState } from 'react'
import { Plus, UsersRound } from 'lucide-react'
import type { GroupSummary } from '../firebase/groupsRealtime'

type Props = { groups: GroupSummary[]; activeGroupId: string; onSelect: (id: string) => void; onCreate: (name: string) => void; onJoin: (code: string) => void }

export function GroupBar({ groups, activeGroupId, onSelect, onCreate, onJoin }: Props) {
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle')
  const [value, setValue] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); if (!value.trim()) return; mode === 'create' ? onCreate(value.trim()) : onJoin(value.trim()); setValue(''); setMode('idle') }
  return <section className="group-bar" aria-label="Kasgeldgroepen">
    <UsersRound />
    <label><span>Actieve groep</span><select value={activeGroupId} onChange={event => onSelect(event.target.value)}>{groups.map(group => <option key={group.id} value={group.id}>{group.name} · {group.role}</option>)}</select></label>
    {mode === 'idle' ? <div className="group-bar-actions"><button onClick={() => setMode('create')}><Plus /> Nieuwe groep</button><button onClick={() => setMode('join')}>Code gebruiken</button></div> : <form onSubmit={submit}><input autoFocus value={value} onChange={event => setValue(event.target.value)} placeholder={mode === 'create' ? 'Naam van de groep' : 'Uitnodigingscode'} /><button>Bevestigen</button><button type="button" onClick={() => setMode('idle')}>Annuleren</button></form>}
  </section>
}
