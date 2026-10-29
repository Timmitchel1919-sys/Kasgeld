# Kasgeld Applicatie

Een React/Vite-dashboard voor maandverdeling binnen een besloten kasgeldgroep. De interface volgt de aangeleverde dashboardreferentie en bevat een maandrad, maandoverzicht, deelnemersregistratie, activiteitenlog en meldingsinstellingen.

## Lokaal starten

```powershell
npm install
npm run dev
```

## Kwaliteitscontroles

```powershell
npm test
npm run build
```

Voor de Firestore Security Rules:

```powershell
npm run test:rules:emulator
```

## Huidige functionele scope

- Interactief maandrad met resultaatstatus.
- Twaalf maanden met vergrendelde april-toewijzing.
- Deelnemers toevoegen via een gevalideerd formulier.
- Lokale opslag van deelnemers in `localStorage`.
- Activiteitenlog na draaien of toevoegen.
- Schakelbare automatische-meldingenstatus.
- Responsieve desktop-, tablet- en mobiele layout.
- Firebase e-mail/wachtwoord-authenticatie met verplichte e-mailverificatie.
- Fail-closed Firestore Security Rules voor profielen, groepen, leden, deelnemers, maanden en auditactiviteiten.
- Lokale emulatorconfiguratie en Rules-tests.
- 2nd-gen callable Cloud Function `spinMonth` op Node.js 22.
- Cryptografisch willekeurige maandkeuze binnen een atomaire Firestore-transactie.
- Idempotente retries, server-side auditlogging en begrensde Function-scaling.

## Productiegrens

Firebase Auth, de benoemde Firestore-database `kasgeld` in `southamerica-east1`, realtime repositories, gesloten uitnodigingen, server-side maandbeheer, profielupdates, Security Rules en de reminder-outbox zijn aanwezig. Echte WhatsApp-/sms-verzending blijft buiten de browser en vereist nog een gekozen provider, geldige opt-in, Secret Manager-configuratie en delivery-webhooks.
