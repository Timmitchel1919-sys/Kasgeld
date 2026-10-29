export type CycleSettings = { cycleYear: number; monthlyContributionCents: number; payoutDay: number }

export function parseCycleSettings(value: unknown): CycleSettings {
  if (!value || typeof value !== 'object') throw new Error('invalid-cycle-settings')
  const input = value as Record<string, unknown>
  const cycleYear = Number(input.cycleYear)
  const monthlyContributionCents = Number(input.monthlyContributionCents)
  const payoutDay = Number(input.payoutDay)
  if (!Number.isInteger(cycleYear) || cycleYear < 2020 || cycleYear > 2100 || !Number.isInteger(monthlyContributionCents) || monthlyContributionCents < 1 || monthlyContributionCents > 100_000_000 || !Number.isInteger(payoutDay) || payoutDay < 1 || payoutDay > 28) throw new Error('invalid-cycle-settings')
  return { cycleYear, monthlyContributionCents, payoutDay }
}

export function parsePayoutAction(value: unknown): 'mark_paid' | 'confirm_received' {
  if (value !== 'mark_paid' && value !== 'confirm_received') throw new Error('invalid-payout-action')
  return value
}
