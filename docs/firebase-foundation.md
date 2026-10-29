# Firebase-foundation

## Gekoppeld project

- Firebase-project: `kasgeld-1ac28`
- Webapp: `Kasgeld`
- Firestore-database: `kasgeld` (benoemde database, dus niet `(default)`).
- Firestore- en Functions-regio: `southamerica-east1`.
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
userGroups/{uid}/groups/{groupId}
invitationCodes/{codeHash}
```

## Beveiligingsgrenzen

- Groepsgegevens zijn alleen leesbaar voor actieve groepsleden.
- Groepen, leden, deelnemers en instellingen zijn volledig gesloten voor clientwrites en worden uitsluitend via Cloud Functions beheerd.
- Deelnemers worden bij een geverifieerde registratie server-side aan de vaste groep toegevoegd.
- Een deelnemer kan zijn toegewezen maand nooit via een clientupdate wijzigen.
- Maandtoewijzingen en auditactiviteiten zijn volledig gesloten voor clientwrites.
- Het activiteitenlogboek is alleen leesbaar voor eigenaar of beheerder; gewone deelnemers zien uitsluitend hun functionele groepsgegevens.
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
8. Een korte groepsbrede spinlease vastleggen, zodat nooit twee deelnemers tegelijk aan het rad kunnen draaien.

De webclient bevat een typed callable-adapter en optionele reCAPTCHA Enterprise App Check-initialisatie. App Check-enforcement mag pas worden geactiveerd nadat de site key en geldige-requestmetrics zijn gecontroleerd.

De huidige projectparameter is daarom expliciet `ENFORCE_APP_CHECK=false`. Dit is een gecontroleerde migratiestatus, geen productie-eindstatus. Firebase Auth, e-mailverificatie, actief groepslidmaatschap, deelnemerstatus, Firestore-transactie en idempotency blijven altijd verplicht.

WhatsApp en sms horen achter een afzonderlijke scheduled Function met providersecret in Secret Manager. Providercredentials mogen nooit naar de browserbundle.

## Server-side beheerlaag

Vier afzonderlijke callable Functions voeren beheeracties atomair uit en controleren bij iedere aanvraag e-mailverificatie, actief lidmaatschap en de rol `owner` of `admin`:

- `assignMonth`: wijst een maand handmatig toe en ruilt bestaande toewijzingen veilig om.
- `unlockMonth`: verwijdert de maandtoewijzing en maakt de deelnemer opnieuw beschikbaar.
- `resetWheel`: verwijdert alle maanddocumenten en wist alle deelnemertoewijzingen in een transactie.
- `updateGroupSettings`: bewaart de instelling voor automatische meldingen.

Elke mutatie schrijft ook een server-side auditactiviteit. De browser gebruikt typed callable-adapters en wacht op de realtime Firestore-listeners als bron van waarheid.

## Besloten toegang en deelnemersprofiel

- Nieuwe niet-adminaccounts hebben een eenmalige uitnodigingscode nodig; codes verlopen na zeven dagen.
- Alleen de codehash wordt opgeslagen. De ruwe code wordt alleen direct na generatie getoond.
- Uitnodigingen worden atomair geconsumeerd tijdens server-side provisioning.
- Iedere deelnemer kan alleen zijn eigen mobiele nummer via `updateOwnPhone` wijzigen.
- Het nummer wordt server-side genormaliseerd en gecontroleerd op internationaal formaat.

## Reminder-outbox

`prepareMonthlyReminders` draait op de zesde om 09:00 in `America/Cayenne`. De Function selecteert deelnemers van de vorige kalendermaand en maakt per periode en deelnemer maximaal één outboxrecord. Zolang geen provider is geconfigureerd blijft de status `pending_provider`; dit is voorbereiding, geen verzendbevestiging.

## Multi-group en deelnemerslevenscyclus

- Een gebruiker kan via `userGroups/{uid}/groups` meerdere actieve groepen veilig wisselen.
- `createGroup` maakt groep, eigenaar, deelnemer, auditactiviteit en gebruikersindex atomair aan.
- `joinGroup` consumeert een eenmalige uitnodiging en schrijft alle lidmaatschapsrecords in één transactie.
- Alleen de eigenaar kan een lid promoveren tot beheerder, degraderen of deactiveren.
- Deactiveren met een toegewezen maand is fail-closed totdat de maand is ontgrendeld.
- Uitnodigingen en notification-outbox zijn realtime zichtbaar in het beheercentrum.

## Ronde en uitbetalingsbevestiging

- Groepsafspraken bewaren kalenderjaar, maandbijdrage in eurocenten en uitbetalingsdag.
- Beheer markeert een maand als uitbetaald; alleen de toegewezen deelnemer bevestigt ontvangst.
- Deze statussen zijn onafhankelijk, realtime zichtbaar en auditbaar.
- Eigendomsoverdracht wijzigt alle autorisatierecords atomair en maakt de oude eigenaar beheerder.
- De JSON-export is begrensd tot de groep, deelnemers, maanden en maximaal 200 recente activiteiten.

## Beheerherstel en operationele status

- Actieve uitnodigingen kunnen server-side worden ingetrokken; de publieke groepsregistratie en geheime codepointer worden atomair geblokkeerd.
- Alleen mislukte of provider-geblokkeerde outboxrecords kunnen opnieuw worden aangeboden. De oorspronkelijke regel blijft behouden als auditspoor.
- Niet-verzonden outboxrecords kunnen worden geannuleerd; verzonden records zijn onveranderlijk.
- Het beheercentrum toont actieve uitnodigingen, verzonden berichten en records die aandacht vereisen.
- Autorisatie en mutatie vinden binnen dezelfde Firestore-transactie plaats om rolwijzigings-races te blokkeren.

## Validatiegrens

- Firebase `--dry-run`: Rules compileren succesvol tegen project `kasgeld-1ac28`; niets gedeployed.
- UI-tests: 8/8 geslaagd.
- Productiebuild: geslaagd.
- Npm-audit na de grpc-override: 0 kwetsbaarheden.
- Firestore Rules compileren zonder waarschuwingen via de officiële Firebase Rules API tegen project `kasgeld-1ac28`.
- Firestore-emulator start lokaal niet op JDK 21 door `Unable to establish loopback connection`. Twee JDK 17-installatieroutes konden in deze omgeving niet worden gedownload; de acht emulatorcases zijn daarom nog niet runtime-geverifieerd.
- Functiondomeintests: 12/12 geslaagd.
- Functions TypeScript-build: geslaagd.
- Firebase Functions dry-run: geslaagd; alle callables en `prepareMonthlyReminders` zijn ontdekt en verpakt, niets gedeployed.
- De Cloud Scheduler API is tijdens de dry-run succesvol geactiveerd.
- Frontend- en Functions-productieafhankelijkheden: beide 0 bekende npm-kwetsbaarheden.
- Tijdens Functions dry-run zijn de vereiste Google Cloud API's voor Functions/Run/Eventarc en Firebase Extensions geactiveerd op het project. Er is geen Function of applicatiecode gepubliceerd.
