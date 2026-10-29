# ADR-0006: Beheerherstel voor uitnodigingen en berichten

**Status:** Accepted
**Date:** 2026-10-29

## Decision

- Een beheerder kan een nog actieve uitnodiging atomair intrekken; zowel de groepsregistratie als de geheime codepointer wordt geblokkeerd.
- Alleen mislukte of provider-geblokkeerde berichten kunnen opnieuw worden aangeboden. De oorspronkelijke outboxregel blijft als auditspoor bestaan.
- Nog niet verzonden berichten kunnen worden geannuleerd; verzonden berichten zijn onveranderlijk.
- Het beheercentrum toont aantallen voor actieve uitnodigingen, verzonden berichten en records die aandacht vereisen.

## Security boundary

Alle acties lopen via geverifieerde callable Functions en controleren actief groepslidmaatschap plus de rol `owner` of `admin`. De browser krijgt geen directe schrijfrechten op uitnodigingen of de outbox.
