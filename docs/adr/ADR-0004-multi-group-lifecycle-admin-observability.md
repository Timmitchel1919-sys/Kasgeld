# ADR-0004: Multi-group index, deelnemerslevenscyclus en beheerobservability

**Status:** Accepted
**Date:** 2026-10-29
**Deciders:** Producteigenaar en implementatie

## Context

Het productfundament vereist meerdere strikt gescheiden groepen per gebruiker. Rechtstreeks alle `members`-subcollecties doorzoeken is onnodig complex en maakt Rules lastiger. Daarnaast moeten rollen, deactivering, uitnodigingen en berichtstatussen vanuit één consistente beheerlaag zichtbaar zijn.

## Decision

- Iedere groepsrelatie krijgt een server-side indexdocument onder `userGroups/{uid}/groups/{groupId}`.
- De groepsdocumenten en hun subcollecties blijven de autoritatieve bron; de gebruikersindex bevat alleen navigatie- en rolsamenvattingen.
- Uitnodigingscodes krijgen een server-only hashpointer onder `invitationCodes/{hash}` zodat een code naar de juiste groep kan worden gerouteerd zonder de ruwe code op te slaan.
- Alleen de eigenaar kan deelnemers promoveren, degraderen, activeren of deactiveren.
- Een deelnemer met een toegewezen maand kan niet worden gedeactiveerd; de maand moet eerst expliciet worden ontgrendeld.
- Uitnodigingsstatus en notification-outbox worden realtime aan administrators getoond, maar blijven onleesbaar voor gewone leden.

## Consequences

- Groepswisselen vereist geen brede collection-group-query.
- Denormalisatie vraagt dat iedere server-side rol- of statuswijziging zowel member, participant als user-group index atomair bijwerkt.
- De eigenaar kan niet via de beheerflow worden gedeactiveerd of gedegradeerd.
- Historische activiteiten blijven behouden wanneer toegang wordt ingetrokken.

## Action Items

1. Live migratie initialiseert `userGroups` tijdens eerstvolgende provisioning.
2. Rules voor user-group index en invitation pointers deployen.
3. Later eventueel een overdrachtsflow voor groepseigenaarschap toevoegen.
