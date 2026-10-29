import { httpsCallable } from 'firebase/functions'
import { requireFunctions } from './client'

type GroupInput = { groupId: string }
type MonthInput = GroupInput & { monthId: string }
type AssignInput = MonthInput & { participantId: string }

async function call<TInput, TResult>(name: string, input: TInput): Promise<TResult> {
  return (await httpsCallable<TInput, TResult>(requireFunctions(), name)(input)).data
}

export const resetWheelOnServer = (groupId: string) => call<GroupInput, { groupId: string }>('resetWheel', { groupId })
export const unlockMonthOnServer = (groupId: string, monthId: string) => call<MonthInput, { groupId: string; monthId: string }>('unlockMonth', { groupId, monthId })
export const assignMonthOnServer = (groupId: string, monthId: string, participantId: string) => call<AssignInput, { groupId: string; monthId: string; participantId: string }>('assignMonth', { groupId, monthId, participantId })
export const updateNotificationsOnServer = (groupId: string, notificationsEnabled: boolean) => call<GroupInput & { notificationsEnabled: boolean }, { groupId: string; notificationsEnabled: boolean }>('updateGroupSettings', { groupId, notificationsEnabled })
