# Referentieanalyse — Kasgeld Applicatie Dashboard

## Bron van waarheid

- Referentie: `Kasgeld Applicatie Dashboard.png`
- Native afmeting: 1680 × 941 pixels.
- Het eerdere groene dashboardconcept is vervangen door deze aangeleverde referentie.

## Productinterpretatie

De app verdeelt de twaalf kalendermaanden onder deelnemers. Een deelnemer mag één keer aan het rad draaien. De gekozen maand wordt onmiddellijk aan die deelnemer toegewezen en voor anderen vergrendeld. De deelnemer ontvangt op de zesde van de daaropvolgende maand automatisch een WhatsApp-bericht of sms over de geplande kasgelduitbetaling.

## Visuele inventaris

- Blauwe horizontale header met muntlogo, productnaam, ondertitel, vier navigatie-items en groepsprofiel.
- Lichtblauwe canvasachtergrond met witte panelen, subtiele borders, afgeronde hoeken en zachte schaduw.
- Linkerkolom: interactief twaalfdelig maandrad, resultaatvlak en spelregel.
- Midden boven: 4 × 3 maandmatrix; beschikbare maanden mintgroen, toegewezen maand donkergrijs.
- Midden onder: compacte deelnemerstabel met registratie- en maandstatus.
- Rechts boven: chronologische activiteitenlijst.
- Rechts onder: meldingsregel, actieve schakelaar, voorbeeldmelding en twee telefoonpreviews.

## Design tokens

- Header: donkerblauw naar helderblauw naar donkerblauw.
- Primaire actie: helder blauw.
- Succes/beschikbaar: smaragdgroen en licht mint.
- Vergrendeld: leigrijs/donkergrijs.
- Achtergrond: zeer licht koel blauw.
- Typografie: smal, compact sans-serif met stevige koppen.
- Hoekradius: circa 8–15 px; panelen groter dan interne controles.

## Functionele bouwgrens

- Eerste implementatie gebruikt browseropslag voor lokale deelnemersdata.
- Het maandrad, deelnemers toevoegen en de meldingsschakelaar zijn interactief.
- Echte WhatsApp-, sms-, authenticatie- en database-integraties vereisen een backend en providercredentials en worden niet gefingeerd.
