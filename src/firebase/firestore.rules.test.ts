import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let environment: RulesTestEnvironment

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-kasgeld',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(resolve('firestore.rules'), 'utf8'),
    },
  })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore()
    await setDoc(doc(db, 'groups', 'group-one'), {
      name: 'Kasgeld Groep', ownerId: 'owner', currency: 'EUR', notificationsEnabled: true,
      createdAt: new Date(), updatedAt: new Date(),
    })
    await setDoc(doc(db, 'groups', 'group-one', 'members', 'owner'), {
      uid: 'owner', email: 'owner@example.com', displayName: 'Owner', role: 'owner', status: 'active', joinedAt: new Date(),
    })
    await setDoc(doc(db, 'groups', 'group-one', 'members', 'member'), {
      uid: 'member', email: 'member@example.com', displayName: 'Member', role: 'member', status: 'active', joinedAt: new Date(),
    })
    await setDoc(doc(db, 'groups', 'group-one', 'members', 'inactive'), {
      uid: 'inactive', email: 'inactive@example.com', displayName: 'Inactive', role: 'member', status: 'inactive', joinedAt: new Date(),
    })
    await setDoc(doc(db, 'groups', 'group-one', 'months', 'april'), {
      month: 'April', participantId: 'participant-one', assignedBy: 'server', assignedAt: new Date(), locked: true,
    })
    await setDoc(doc(db, 'groups', 'group-one', 'activities', 'activity-one'), {
      type: 'user_registered', actorUid: 'owner', participantId: 'member', createdAt: new Date(),
    })
    await setDoc(doc(db, 'groups', 'group-one', 'invitations', 'invite-one'), {
      status: 'active', createdBy: 'owner', createdAt: new Date(), expiresAt: new Date(),
    })
    await setDoc(doc(db, 'groups', 'group-one', 'notificationOutbox', 'message-one'), {
      participantId: 'member', status: 'pending_provider', createdAt: new Date(),
    })
    await setDoc(doc(db, 'userGroups', 'owner', 'groups', 'group-one'), {
      groupId: 'group-one', name: 'Kasgeld Groep', role: 'owner', status: 'active', joinedAt: new Date(),
    })
    await setDoc(doc(db, 'invitationCodes', 'secret-hash'), { groupId: 'group-one', status: 'active' })
  })
})

afterAll(async () => environment.cleanup())

describe('Firestore security boundary', () => {
  it('weigert een profielwrite van een niet-geverifieerde gebruiker', async () => {
    const db = environment.authenticatedContext('user-one', { email: 'u@example.com', email_verified: false }).firestore()
    await assertFails(setDoc(doc(db, 'users', 'user-one'), {
      uid: 'user-one', email: 'u@example.com', displayName: 'User One', createdAt: new Date(), updatedAt: new Date(),
    }))
  })

  it('staat een geldig eigen profiel toe na e-mailverificatie', async () => {
    const db = environment.authenticatedContext('user-one', { email: 'u@example.com', email_verified: true }).firestore()
    await assertSucceeds(setDoc(doc(db, 'users', 'user-one'), {
      uid: 'user-one', email: 'u@example.com', displayName: 'User One', createdAt: new Date(), updatedAt: new Date(),
    }))
  })

  it('laat een groepslid de eigen groep lezen en blokkeert een buitenstaander', async () => {
    const ownerDb = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    const outsiderDb = environment.authenticatedContext('outsider', { email: 'out@example.com', email_verified: true }).firestore()
    await assertSucceeds(getDoc(doc(ownerDb, 'groups', 'group-one')))
    await assertFails(getDoc(doc(outsiderDb, 'groups', 'group-one')))
  })

  it('blokkeert groepslezingen zodra een lid inactief is', async () => {
    const db = environment.authenticatedContext('inactive', { email: 'inactive@example.com', email_verified: true }).firestore()
    await assertFails(getDoc(doc(db, 'groups', 'group-one')))
  })

  it('blokkeert rechtstreekse clientregistratie van deelnemers', async () => {
    const db = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    await assertFails(setDoc(doc(db, 'groups', 'group-one', 'participants', 'participant-two'), {
      name: 'Naomi', phone: '+597 8123456', status: 'registered', assignedMonth: null,
      createdBy: 'owner', createdAt: new Date(), updatedAt: new Date(),
    }))
  })

  it('houdt het activiteitenlogboek uitsluitend zichtbaar voor administrators', async () => {
    const ownerDb = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    const memberDb = environment.authenticatedContext('member', { email: 'member@example.com', email_verified: true }).firestore()
    await assertSucceeds(getDoc(doc(ownerDb, 'groups', 'group-one', 'activities', 'activity-one')))
    await assertFails(getDoc(doc(memberDb, 'groups', 'group-one', 'activities', 'activity-one')))
  })

  it('houdt uitnodigingen uitsluitend zichtbaar voor administrators', async () => {
    const ownerDb = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    const memberDb = environment.authenticatedContext('member', { email: 'member@example.com', email_verified: true }).firestore()
    await assertSucceeds(getDoc(doc(ownerDb, 'groups', 'group-one', 'invitations', 'invite-one')))
    await assertFails(getDoc(doc(memberDb, 'groups', 'group-one', 'invitations', 'invite-one')))
  })

  it('houdt de berichten-outbox uitsluitend zichtbaar voor administrators', async () => {
    const ownerDb = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    const memberDb = environment.authenticatedContext('member', { email: 'member@example.com', email_verified: true }).firestore()
    await assertSucceeds(getDoc(doc(ownerDb, 'groups', 'group-one', 'notificationOutbox', 'message-one')))
    await assertFails(getDoc(doc(memberDb, 'groups', 'group-one', 'notificationOutbox', 'message-one')))
  })

  it('blokkeert iedere client-side maandtoewijzing', async () => {
    const db = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    await assertFails(setDoc(doc(db, 'groups', 'group-one', 'months', 'mei'), {
      month: 'Mei', participantId: 'participant-two', assignedBy: 'owner', assignedAt: new Date(), locked: true,
    }))
  })

  it('laat alleen de gebruiker de eigen groepsindex lezen', async () => {
    const ownerDb = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    const memberDb = environment.authenticatedContext('member', { email: 'member@example.com', email_verified: true }).firestore()
    await assertSucceeds(getDoc(doc(ownerDb, 'userGroups', 'owner', 'groups', 'group-one')))
    await assertFails(getDoc(doc(memberDb, 'userGroups', 'owner', 'groups', 'group-one')))
  })

  it('maakt invitation pointers volledig server-only', async () => {
    const ownerDb = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    await assertFails(getDoc(doc(ownerDb, 'invitationCodes', 'secret-hash')))
  })
})
