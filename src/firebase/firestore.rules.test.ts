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
    await setDoc(doc(db, 'groups', 'group-one', 'months', 'april'), {
      month: 'April', participantId: 'participant-one', assignedBy: 'server', assignedAt: new Date(), locked: true,
    })
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

  it('laat een geverifieerd groepslid een deelnemer registreren', async () => {
    const db = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    await assertSucceeds(setDoc(doc(db, 'groups', 'group-one', 'participants', 'participant-two'), {
      name: 'Naomi', phone: '+597 8123456', status: 'registered', assignedMonth: null,
      createdBy: 'owner', createdAt: new Date(), updatedAt: new Date(),
    }))
  })

  it('blokkeert iedere client-side maandtoewijzing', async () => {
    const db = environment.authenticatedContext('owner', { email: 'owner@example.com', email_verified: true }).firestore()
    await assertFails(setDoc(doc(db, 'groups', 'group-one', 'months', 'mei'), {
      month: 'Mei', participantId: 'participant-two', assignedBy: 'owner', assignedAt: new Date(), locked: true,
    }))
  })
})
