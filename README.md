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

Firebase Auth, het Firestore-contract, de Security Rules en de server-side maandloting zijn aanwezig. De huidige dashboardrecords gebruiken nog de bestaande lokale frontendstate. De volgende laag moet het dashboard via realtime Firestore-repositories aan groepen, deelnemers, maanden en activiteiten koppelen. WhatsApp-/sms-verzending blijft buiten de browser en vereist een scheduled Function plus gekozen provider.
