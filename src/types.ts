export type Participant = {
  id: string
  name: string
  phone: string
  initials: string
  color: string
  email?: string
  assignedMonth?: string
  whatsappOptIn?: boolean
  role?: 'owner' | 'admin' | 'member'
  memberStatus?: 'active' | 'inactive'
}

export type Activity = {
  id: string
  icon: 'person' | 'lock' | 'users' | 'info'
  title: string
  detail: string
  time: string
  tone?: 'success'
}
