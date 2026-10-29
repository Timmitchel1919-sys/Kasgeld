import { FormEvent, useState } from 'react'
import { X } from 'lucide-react'

type Props = { open: boolean; onClose: () => void; onSubmit: (name: string, phone: string) => void }

export function AddParticipantModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  if (!open) return null
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !phone.trim()) return; onSubmit(name.trim(), phone.trim()); setName(''); setPhone('') }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button className="modal-close" onClick={onClose} aria-label="Sluiten"><X /></button><h2 id="modal-title">Deelnemer toevoegen</h2><p>Registreer een naam en geldig mobiel nummer.</p>
    <form onSubmit={submit}><label>Naam<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Volledige naam" /></label><label>Mobiel nummer<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+597 8..." /></label><button className="primary-button" type="submit">Deelnemer toevoegen</button></form>
  </div></div>
}
