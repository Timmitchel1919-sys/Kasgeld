import type { Timestamp } from 'firebase/firestore'

export type GroupRole = 'owner' | 'admin' | 'member'
export type MemberStatus = 'active' | 'inactive'
export type ParticipantStatus = 'registered'

export type UserProfileDocument = {
  uid: string
  email: string
  displayName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
export type GroupDocument = {
  name: string
  ownerId: string
  currency: 'EUR'
  notificationsEnabled: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type GroupMemberDocument = {
  uid: string
  email: string
  displayName: string
  role: GroupRole
  status: MemberStatus
  joinedAt: Timestamp
}

export type ParticipantDocument = {
  name: string
  email: string
  phone: string
  status: ParticipantStatus
  assignedMonth: string | null
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type MonthAssignmentDocument = {
  month: string
  participantId: string
  assignedBy: string
  assignedAt: Timestamp
  locked: true
}

