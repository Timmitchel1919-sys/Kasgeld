# ADR-0003: Besloten toegang, eigen profiel en reminder-outbox

**Status:** Accepted
**Date:** 2026-10-29
**Deciders:** Producteigenaar en implementatie

## Context

Kasgeld is bedoeld voor een besloten groep vrienden en collega's. Automatisch ieder geverifieerd Firebase-account toelaten maakt de groep feitelijk openbaar. Tegelijk moeten deelnemers hun eigen mobiele nummer kunnen beheren en moeten herinneringen betrouwbaar voorbereid worden zonder providercredentials in de browser.

## Decision

1. Nieuwe niet-adminleden consumeren een eenmalige, zeven dagen geldige uitnodigingscode in dezelfde transactie waarmee hun lid- en deelnemerrecords worden aangemaakt.
2. Alleen eigenaar of beheerder kan uitnodigingen genereren. Alleen de SHA-256-hash wordt opgeslagen; de ruwe code wordt eenmaal aan de beheerder getoond.
3. Een deelnemer kan uitsluitend zijn eigen telefoonnummer via een callable Function bijwerken. Nummers worden als internationaal E.164-achtig formaat gevalideerd.
4. Een geplande Function maakt op de zesde een idempotent outboxrecord voor de deelnemer van de vorige kalendermaand.
5. De outbox heeft voorlopig status `pending_provider`. Er wordt geen WhatsApp- of sms-succes geclaimd voordat een echte provider met Secret Manager is gekoppeld.

## Options Considered

### Open registratie

Lage complexiteit, maar ongeschikt voor een besloten financiële vertrouwensgroep.

### E-mailallowlist

Veilig maar administratief star; iedere wijziging vereist vooraf een exact e-mailadres.

### Eenmalige uitnodigingscodes

Beperkte extra complexiteit, eenvoudig deelbaar met bekende personen en atomair te consumeren. Dit sluit het beste aan op de productgrens.

## Consequences

- Een geverifieerd account zonder uitnodiging krijgt geen groepslidmaatschap.
- Verloren of verlopen codes moeten door de administrator opnieuw worden aangemaakt.
- Providerselectie, opt-inregistratie en delivery/webhookstatus blijven vereist voordat echte berichten worden verzonden.
- De vaste groep kan later worden uitgebreid naar meerdere groepen zonder het uitnodigingsmodel te vervangen.

## Action Items

1. Firestore aanmaken in de definitieve regio.
2. Rules en Functions deployen na Firebase-herauthenticatie.
3. WhatsApp-/sms-provider kiezen en juridische opt-invereisten vastleggen.
4. Outbox-consumer en delivery-webhooks implementeren met secrets buiten de browser.
