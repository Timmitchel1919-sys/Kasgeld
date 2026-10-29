import { FirebaseError } from 'firebase/app'

const messages: Record<string, string> = {
  'auth/email-already-in-use': 'Dit e-mailadres is al geregistreerd.',
  'auth/invalid-credential': 'E-mailadres of wachtwoord is onjuist.',
  'auth/invalid-email': 'Vul een geldig e-mailadres in.',
  'auth/too-many-requests': 'Te veel pogingen. Probeer het later opnieuw.',
  'auth/weak-password': 'Gebruik een wachtwoord van minimaal twaalf tekens.',
  'auth/network-request-failed': 'De verbinding met Firebase is mislukt.',
  'auth/popup-blocked': 'De Google-popup is geblokkeerd. Sta pop-ups toe en probeer opnieuw.',
  'auth/popup-closed-by-user': 'Google-aanmelding is geannuleerd.',
  'auth/cancelled-popup-request': 'Er is al een Google-aanmelding actief.',
  'auth/account-exists-with-different-credential': 'Dit e-mailadres bestaat al met een andere inlogmethode.',
  'permission-denied': 'Je hebt geen toestemming voor deze actie.',
}
export function readableFirebaseError(error: unknown): string {
  if (error instanceof FirebaseError) return messages[error.code] || `Firebase-fout: ${error.code}`
  return error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden.'
}

