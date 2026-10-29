export type Participant = {
  id: number
  name: string
  phone: string
  initials: string
  color: string
  assignedMonth?: string
}

export type Activity = {
  id: number
  icon: 'person' | 'lock' | 'users' | 'info'
  title: string
  detail: string
  time: string
  tone?: 'success'
}
