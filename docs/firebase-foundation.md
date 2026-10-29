# Firebase-foundation

## Gekoppeld project

- Firebase-project: `kasgeld-1ac28`
- Webapp: `Kasgeld`
- De publieke webconfiguratie staat uitsluitend in `.env.local`; het bestand is uitgesloten van Git.

## Authenticatie

- E-mail en wachtwoord.
- Minimaal twaalf tekens voor nieuwe wachtwoorden in de clientflow.
- Verplichte e-mailverificatie voordat een profiel of groepsgegeven mag worden geschreven.
- De verificatiestatus wordt opnieuw geladen en het ID-token wordt geforceerd vernieuwd.
- Firestore-profielen zijn uitsluitend door de eigen gebruiker leesbaar en schrijfbaar.

## Firestore-model

```text
users/{uid}
groups/{groupId}
groups/{groupId}/members/{uid}
groups/{groupId}/participants/{participantId}
groups/{groupId}/months/{monthId}
groups/{groupId}/activities/{activityId}
```

## Beveiligingsgrenzen

- Groepsgegevens zijn alleen leesbaar voor actieve groepsleden.
- Groepsinstellingen zijn alleen wijzigbaar door eigenaar of beheerder.
- Deelnemers kunnen alleen door geverifieerde groepsleden worden geregistreerd.
- Een deelnemer kan zijn toegewezen maand niet via een clientupdate wijzigen.
- Maandtoewijzingen en auditactiviteiten zijn volledig gesloten voor clientwrites.
- Deletes zijn in deze laag standaard geblokkeerd om historische integriteit te bewaren.

## Server-side lotingslaag

De callable Cloud Function `spinMonth` voert de maandloting uit binnen een Firestore-transactie:

1. App Check (na activatie via parameter) en geverifieerde Auth controleren.
2. Actief groepslid en deelnemer controleren.
3. Bevestigen dat de deelnemer nog niet heeft gedraaid.
4. Beschikbare maanden server-side bepalen.
5. Een maand kiezen met cryptografisch sterke willekeur.
6. Toewijzing, deelnemerupdate en auditactiviteit atomair schrijven.
7. Een idempotency key afdwingen om dubbele spins te blokkeren en veilige retries hetzelfde resultaat te laten teruggeven.

De webclient bevat een typed callable-adapter en optionele reCAPTCHA Enterprise App Check-initialisatie. App Check-enforcement mag pas worden geactiveerd nadat de site key en geldige-requestmetrics zijn gecontroleerd.

De huidige projectparameter is daarom expliciet `ENFORCE_APP_CHECK=false`. Dit is een gecontroleerde migratiestatus, geen productie-eindstatus. Firebase Auth, e-mailverificatie, actief groepslidmaatschap, deelnemerstatus, Firestore-transactie en idempotency blijven altijd verplicht.

WhatsApp en sms horen achter een afzonderlijke scheduled Function met providersecret in Secret Manager. Providercredentials mogen nooit naar de browserbundle.

## Validatiegrens

- Firebase `--dry-run`: Rules compileren succesvol tegen project `kasgeld-1ac28`; niets gedeployed.
- UI-tests: 4/4 geslaagd.
- Productiebuild: geslaagd.
- Npm-audit na de grpc-override: 0 kwetsbaarheden.
- Firestore-emulator kon in Codex Desktop niet starten door Java `Unable to establish loopback connection`; de Rules-testcode bestaat, maar de vijf emulatorcases zijn daarom nog niet runtime-geverifieerd.
- Functiondomeintests: 8/8 geslaagd.
- Functions TypeScript-build: geslaagd.
- Firebase Functions dry-run: geslaagd; `spinMonth` is ontdekt en verpakt, niets gedeployed.
- Frontend- en Functions-productieafhankelijkheden: beide 0 bekende npm-kwetsbaarheden.
- Tijdens Functions dry-run zijn de vereiste Google Cloud API's voor Functions/Run/Eventarc en Firebase Extensions geactiveerd op het project. Er is geen Function of applicatiecode gepubliceerd.
