# ADR-0005: Rondeafspraken, dubbele uitbetalingsbevestiging en eigendomsoverdracht

**Status:** Accepted
**Date:** 2026-10-29
**Deciders:** Producteigenaar en implementatie

## Context

Kasgeld moet afspraken over jaar, bijdrage en betaaldag kunnen vastleggen zonder bankrekening, incasso of echte geldtransactie te worden. Een enkele partij mag niet zelfstandig kunnen vastleggen dat geld zowel betaald als ontvangen is. Groepseigendom moet overdraagbaar zijn zonder autorisatiegat en groepsdata moet exporteerbaar blijven.

## Decision

- Iedere groep heeft één actieve rondeconfiguratie: kalenderjaar, maandbijdrage in eurocenten en uitbetalingsdag 1-28.
- De beheerder kan een maand markeren als uitbetaald; uitsluitend de toegewezen ontvanger kan ontvangst bevestigen.
- Beide feiten worden afzonderlijk op het maanddocument en in het activiteitenlog opgeslagen.
- Alleen de huidige eigenaar kan eigendom atomair overdragen aan een actief lid.
- De voormalige eigenaar wordt beheerder; group, members, participants en user-group index veranderen in dezelfde transactie.
- Beheerders kunnen een begrensde JSON-export downloaden. De applicatie biedt geen destructieve groepsdelete.

## Consequences

- Kasgeld registreert afspraken en verklaringen, maar verplaatst of verifieert geen geld bij een bank.
- Bedragen worden als gehele eurocenten opgeslagen om afrondingsfouten te voorkomen.
- Een volledige financiële administratie of incassoflow blijft expliciet buiten scope.
- Export bevat persoonlijke groepsgegevens en moet door de beheerder veilig worden bewaard.
