import { createHash, randomBytes } from 'node:crypto'

export function normalizeInviteCode(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32)
}

export function hashInviteCode(code: string): string {
  return createHash('sha256').update(normalizeInviteCode(code)).digest('hex')
}

export function createInviteCode(): string {
  const raw = randomBytes(9).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(12, 'X').slice(0, 12)
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

export function normalizePhone(value: unknown): string {
  if (typeof value !== 'string') throw new Error('invalid-phone')
  const phone = value.trim().replace(/[\s()-]/g, '')
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('invalid-phone')
  return phone
}

export function reminderMonthForDate(date: Date): string | null {
  if (date.getUTCDate() !== 6) return null
  const labels = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
  return labels[(date.getUTCMonth() + 11) % 12] ?? null
}
