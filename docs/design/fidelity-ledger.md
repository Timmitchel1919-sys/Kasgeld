# Fidelity-ledger

## Verificatiemethode

- Bronvisual: `kasgeld-dashboard-reference.png` op 1680 × 941.
- Implementatierender: lokale Chrome headless op exact 1680 × 941.
- De ingebouwde browser en gekoppelde Chrome-extensie konden de sandboxed localhostserver niet bereiken; daarom is lokale Chrome headless als fallback gebruikt.
- De Windows headless-browser dwingt bij een gevraagde breedte van 390 px een minimale CSS-viewport van circa 500 px af en knipt de PNG daarna af. De mobiele CSS-breakpoints zijn actief, maar een native 390-px screenshot is hierdoor in deze omgeving niet betrouwbaar.

## Vergelijkingspunten

| Punt | Referentie | Implementatie | Beoordeling |
|---|---|---|---|
| Header | Blauwe gradient, muntlogo, vier nav-items, groepsblok | Zelfde structuur, kleurverloop en hiërarchie | Overeenkomstig |
| Desktopgrid | Groot rad links, twee middenpanelen, twee rechterpanelen | Zelfde drie-koloms verhouding en paneelvolgorde | Overeenkomstig |
| Maandrad | Twaalf kleursegmenten, centrale draai-actie, april vergrendeld | Code-native conic-gradient, labels, pointer en interactieve actie | Overeenkomstig |
| Maandoverzicht | 4 × 3 mintgroene matrix, april donker | Zelfde matrix, statuskleuren en labels | Overeenkomstig |
| Deelnemers | Compacte tabel met status en maand | Zelfde kolommen, vijf seedrecords en werkend toevoegformulier | Overeenkomstig |
| Activiteit | Vier chronologische items | Zelfde startinhoud plus werkende lokale updates | Overeenkomstig |
| Meldingen | Regel, toggle, voorbeeld en twee telefoons | Zelfde anatomie en schakelbare status | Overeenkomstig |
| Typografie | Smalle compacte sans-serif | Roboto Condensed met expliciete controlestijlen | Overeenkomstig |
| Avatars | Portretfoto's | Lokale initialenavatars | Bewuste afwijking: geen biometrische nepdata of externe assetafhankelijkheid |

## Copy-diff boven de vouw

De zichtbare productnaam, ondertitel, navigatielabels, paneeltitels, maandnamen, statussen, deelnemernamen en meldingscopy volgen de referentie. Er is geen marketingcopy of nieuwe productclaim toegevoegd.

## Functionele verificatie

- Dashboardinhoud en vergrendelde maand renderen.
- Een deelnemer kan via het formulier worden toegevoegd en wordt lokaal bewaard.
- Automatische meldingen kunnen aan en uit worden gezet.
- Het maandrad draait en schrijft na voltooiing een activiteit.
