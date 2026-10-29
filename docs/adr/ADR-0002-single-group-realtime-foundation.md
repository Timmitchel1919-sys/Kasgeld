# ADR-0002: Eén server-geprovisioneerde hoofdgroep als realtime fundament

**Status:** Accepted
**Date:** 2026-10-29
**Deciders:** Shaquil, Kasgeld engineering

## Context

De huidige interface bewaart deelnemers en maandstatus lokaal. De productrichting vereist één administrator (`sheq97@gmail.com`), automatische opname van geregistreerde gebruikers en één gedeeld realtime overzicht. Client-side groepsaanmaak zou gebruikers de kans geven hun eigen rol te beïnvloeden.

## Decision

De eerste productversie gebruikt de vaste groep `kasgeld-main`. Een callable Function provisiont ieder geverifieerd account idempotent als lid en deelnemer. Alleen het vaste admin-e-mailadres kan de groep initialiseren en krijgt de rol `owner`; alle andere accounts krijgen `member`. De client leest groep, deelnemers, maanden en activiteiten via realtime Firestore-listeners.

## Options Considered

### A. Vaste hoofdgroep met serverprovisioning

**Pros:** klein aanvalsoppervlak, automatische registratie, eenvoudige realtime client.

**Cons:** nog geen uitnodigingen of meerdere groepen.

### B. Client-side dynamische groepen

**Pros:** snel en flexibel.

**Cons:** grotere autorisatiecomplexiteit en ongeschikt voor automatische veilige roltoekenning.

### C. Uitnodigingsmodel met meerdere groepen

**Pros:** sluit aan op de volledige langetermijnvisie.

**Cons:** vereist uitnodigingstokens, membership-indexering en extra beheerflows voordat de kern bruikbaar is.

## Consequences

- Firestore wordt de enige productiebron van waarheid.
- `localStorage` blijft uitsluitend een niet-Firebase ontwikkelfallback.
- Meerdere groepen en uitnodigingen worden een expliciete vervolgmigratie.
- Admin-mutaties blijven afzonderlijke callable Functions; de client schrijft geen maanden of activiteiten.

## Action Items

1. [x] Idempotente provisioning Function.
2. [x] Realtime clientrepository.
3. [ ] Firestore-database aanmaken en Rules deployen.
4. [ ] Adminmutaties server-side implementeren.
5. [ ] Later migreren naar uitnodigingen/meerdere groepen indien productbesluit bevestigd.
