# ADR-0001: Server-side maandloting

**Status:** Accepted
**Date:** 2026-10-29
**Deciders:** Shaquil, Kasgeld engineering

## Context

Iedere deelnemer mag één keer draaien en iedere kalendermaand mag één keer worden toegewezen. De uitslag moet niet door een browsergebruiker, gemanipuleerde JavaScriptbundle of dubbele netwerkrequest kunnen worden beïnvloed. De app gebruikt Firebase Auth en Firestore.

## Decision

De enige toegestane schrijfroute voor maandtoewijzingen is een 2nd-gen Firebase callable Function op Node.js 22. De Function controleert Auth, e-mailverificatie, App Check-configuratie, actief groepslidmaatschap, deelnemerstatus en een idempotency key. Zij kiest cryptografisch willekeurig uit de resterende maanden en schrijft maand, deelnemer, auditactiviteit en idempotency-resultaat in één Firestore-transactie.

## Options Considered

### Option A: Client-side loting

| Dimension | Assessment |
|---|---|
| Complexity | Laag |
| Kosten | Laag |
| Manipulatierisico | Onaanvaardbaar hoog |
| Concurrency | Zwak |

**Pros:** snelle implementatie, directe animatie.

**Cons:** uitslag en writes zijn via DevTools manipuleerbaar; race conditions kunnen dubbele maanden veroorzaken.

### Option B: Callable Function met Firestore-transactie

| Dimension | Assessment |
|---|---|
| Complexity | Gemiddeld |
| Kosten | Laag bij kleine groepen |
| Manipulatierisico | Laag |
| Concurrency | Sterk |

**Pros:** vertrouwde randombron, atomische writes, herleidbare audittrail, Auth- en App Check-context automatisch beschikbaar.

**Cons:** Cloud Functions vereist het Blaze-plan; cold starts en operationele monitoring zijn noodzakelijk.

### Option C: Eigen API/server

| Dimension | Assessment |
|---|---|
| Complexity | Hoog |
| Kosten | Gemiddeld |
| Manipulatierisico | Laag |
| Operationeel beheer | Hoog |

**Pros:** maximale runtimecontrole en providerneutraliteit.

**Cons:** disproportioneel beheer voor de huidige schaal en bestaande Firebase-stack.

## Trade-off Analysis

Option B behoudt de bestaande stack en verplaatst alleen de integriteitskritieke operatie naar een vertrouwde omgeving. App Check-enforcement wordt via een Firebase-parameter geactiveerd nadat de webclient een geldige attestationprovider heeft; Auth en alle zakelijke controles zijn altijd verplicht.

## Consequences

- Firestore Rules blijven clientwrites naar `months` en `activities` weigeren.
- De frontend moet een stabiele idempotency key per klik hergebruiken bij retries.
- Een groep kan maximaal twaalf geslaagde toewijzingen bevatten.
- Operationele logs bevatten identifiers maar geen telefoonnummers of berichtinhoud.
- Deploy vereist een Firebase-project op het Blaze-plan.

## Action Items

1. [x] Callable Function en domeintests implementeren.
2. [x] Functieruntime en emulatorconfiguratie vastleggen.
3. [ ] Realtime Firestore-repository aan het dashboard koppelen.
4. [ ] App Check-provider voor de webclient configureren en enforcement activeren.
5. [ ] Emulatorintegratietests buiten de geblokkeerde Codex Desktop-loopback uitvoeren.
