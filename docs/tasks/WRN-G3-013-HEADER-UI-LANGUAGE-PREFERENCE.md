# Task Brief – WRN-G3-013 Header-UI-Sprachwahl

## Identitaet

- Task-ID: `WRN-G3-013`
- Titel: Echte persistente UI-Sprachwahl fuer App und responsive Website
- Phase/Welle: G3 / Marken-, Shell- und Accessibility-Paritaet
- Auftraggeber: Product Owner
- Status: **ABGESCHLOSSEN – TECHNISCH GREEN UND DURCH PO-069 VISUELL AKZEPTIERT**
- Ausgangscheckpoint: G3-012-Abnahme `fd6cbbe`
- Dokumentarischer Vorbereitungscheckpoint: `b4d4a27`
- Startentscheidung: `START WRN-G3-013` am 27. August 2026
- Startcheckpoint: `3f35b38`
- Produkt-/Testkandidat: `56057dd`
- Security-/Privacy-GREEN: `0afcc34`
- Visual-/Accessibility-YELLOW: `3125cd5`
- PO-067-Korrekturentscheidung: `G3-013 M-001 BEHEBEN` am 27. August 2026
- PO-067-Korrekturstartcheckpoint: `af0138f`
- PO-067-Korrekturkandidat: `b21b02e`
- PO-067-Evidence/-Handoff: `f181d0d`
- PO-067-unabhaengige Re-QA-YELLOW: `01a0e07`
- PO-068-Korrekturentscheidung: `G3-013 M-001 ERNEUT BEHEBEN` am 27. August 2026
- PO-068-Korrekturstartcheckpoint: `e8e5758`
- PO-068-Incident-Diagnose: `a0504ce`
- PO-068-deterministische Re-QA-YELLOW: `91a9971`
- PO-068-Korrekturkandidat: `0462b4c`
- PO-068-Implementierungsevidenz/-Handoff: `a51ebe2`
- PO-068-finale unabhaengige Re-QA-GREEN: `40f37f6`
- Sichtbare Abnahme: PO-069, `G3-013 VISUELL AKZEPTIERT`, 28. August 2026
- Abgenommener Produktkandidat: `0462b4c`; technischer Status: `9fa7795`
- Abschluss-Handoff: `docs/handoffs/WRN-G3-013-visual-acceptance.md`
- Einziges Implementierungsgate: `START WRN-G3-013`
- Paritaetsbezug: `UX-01`, `UX-10`, `NEWS-08`, `SYS-02`, `SYS-06`, `SYS-07`
- Risikobezug: `R-08`, `R-24`, `R-42`

## Produktziel in einfacher Sprache

App und responsive Website erhalten im bestehenden Header eine echte native
Sprachauswahl. Beim allerersten Oeffnen ist Englisch aktiv. Waehlt ein Mensch
eine andere gueltige Sprache, bleibt diese Auswahl lokal gespeichert und ist
beim naechsten Oeffnen desselben Clients wieder aktiv.

Die Auswahl darf nicht nur den sichtbaren Sprachcode umschalten. Alle
Shell-, Navigations-, Formular-, Status-, Dialog-, Fehler-, Offline- und
Accessibility-Texte des jeweiligen dynamischen Clients muessen aus einem
vollstaendigen lokalen Katalog der aktiven UI-Sprache stammen.

## Gebundene Referenzparitaet

Die aktuelle Legacy-App belegt:

- natives Header-`select` in `classic.html`;
- genau neun UI-Sprachen: `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `el`, `tr`;
- Englisch als Erststartwert;
- Speicherung unter dem historischen Key `wrn_system_lang`;
- Wiederherstellung beim erneuten Oeffnen;
- Aktualisierung von `document.documentElement.lang`.

Der historische Key und die monolithische Implementierung werden nicht
kopiert. Erhalten wird das sichtbare Verhalten mit neuen getrennten,
versionierten Clientgrenzen.

## Verbindlicher UI-Sprachvertrag

1. Exakt erlaubte IDs: `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `el`, `tr`.
2. Fehlender lokaler Wert bedeutet immer `en`. Browser-, Betriebssystem-, URL-
   oder Geraetesprache wird nicht als stiller Default verwendet.
3. App und Website verwenden getrennte Keys:
   - `wrn.mobile-ui-language.v1`
   - `wrn.website-ui-language.v1`
4. Ein fehlender Key erzeugt keinen automatischen Schreibvorgang.
5. Nur eine ausdrueckliche gueltige Nutzerauswahl wird gespeichert.
6. Ungueltige, unbekannte, defekte oder nicht lesbare Werte aktivieren `en`,
   werden aber nicht automatisch geloescht oder ueberschrieben.
7. Schlaegt `setItem` fehl, darf die UI fuer die Sitzung weiter bedienbar
   bleiben, aber Persistenz darf nicht als erfolgreich behauptet werden.
8. `document.documentElement.lang` entspricht der aktiven erlaubten UI-ID.
   Alle neun gebundenen Sprachen bleiben `dir="ltr"`.
9. Kataloge sind lokal gebuendelt, typisiert, vollstaendig und schluesselgleich.
   Storagewerte duerfen niemals dynamische Imports, Pfade oder HTML bestimmen.
10. Sichtbare Texte werden als React-Text ausgegeben; kein
    `dangerouslySetInnerHTML` und kein HTML aus Katalogen.

## Header- und Accessibility-Vertrag

- Mobile: Sprachwahl in der bestehenden Aktionsgruppe, sinnvoll zwischen
  `Mehr` und Theme-Auswahl; kontrollierter Umbruch ist erlaubt.
- Website: eigene Headeraktion neben der Theme-Auswahl; Navigation und Marke
  duerfen bei engem Layout nicht ueberlagert oder verdraengt werden.
- Es wird ein natives `<label><select>` verwendet, kein eigenes Popup und keine
  Flaggenauswahl.
- Geschlossen darf der sichtbare Wert kompakt `EN`, `DE`, `ES`, `FR`, `IT`,
  `PT`, `RU`, `EL` oder `TR` zeigen; Optionen nennen den Eigennamen und Code.
- Der zugaengliche Name entspricht der aktiven UI-Sprache, nicht nur einem
  unbeschrifteten Code.
- Mindestziel 44 x 44 CSS-Pixel, sichtbarer Fokus, native Tastaturbedienung.
- Nach Auswahl bleibt der Fokus auf dem Select. Es gibt keine Navigation,
  keinen Reset und keinen ungewollten Menuewechsel.
- Die akzeptierte G3-009-/G3-010-Header-, Marken- und Themewirkung bleibt
  erhalten; dieser Slice ist kein Header-Redesign.

## Was die UI-Sprachwahl nicht ist

- keine Artikel- oder Inhaltsuebersetzung;
- keine Aenderung von `originalLanguage`, Inhaltsfilter, Artikeltext, Titel,
  Quelle, IDs, Revisionen oder Hashes;
- kein Translation-Worker, KI-/API-Provider oder Remoteaufruf;
- kein Cookie, URL-Parameter, Analytics- oder Logsignal;
- kein `sessionStorage`, IndexedDB, Cache Storage oder Service Worker;
- keine Kopplung an Theme- oder Lesestatuskeys;
- keine stillschweigende Aenderung statischer SEO-Artikellandingpages.

Statische Landingpages behalten in diesem Slice ihre autoritative
Artikel-/Dokumentsprache und ihren bestehenden Publisher. Eine spaetere
lokalisierte Landingpage-Shell braucht ein eigenes sichtbares Gate.

## Erlaubte spaetere Implementierungspfade nach Start

- ein neues kleines gemeinsames, UI-spezifisches Sprach-/Copy-Paket;
- getrennte lokale App-/Website-Sprachadapter;
- Mobile-/Website-Header und dynamische Shellprojektionen;
- lokale Katalogdateien fuer alle neun Sprachen;
- eng zugehoerige Unit-, Contract-, Komponenten- und Browsertests;
- G3-013-Evidenz und Handoffs.

Nicht erlaubt sind Contentvertraege, Releaseartefakte, Fixtures, Publisher,
statische Landingpages, Backend/Cloud, Android-Native, Remote/CI, Deployment,
Signierung, Upload oder Veroeffentlichung.

## Agenten- und Kostenfolge nach `START WRN-G3-013`

1. Genau ein `frontend_brand_engineer` definiert zuerst den typisierten
   Schluesselvertrag, den kanonischen englischen Katalog, die getrennten
   Speicheradapter und die Clientintegration. Er darf noch keine unkontrolliert
   unvollstaendigen Sprachoptionen sichtbar schalten.
2. Nach gesichertem Vertrag koennen bis zu drei
   `spark_micro_task_worker` ausschliesslich getrennte Kataloggruppen bearbeiten:
   `de/es/fr`, `it/pt/tr` und `ru/el`. Sie besitzen keine Produktlogik und
   nutzen damit das separate Spark-Kontingent fuer repetitive Copyarbeit.
3. Ein frischer `frontend_brand_engineer` prueft Schluesselparitaet,
   Sprachwirkung und Integration und sichert den Produktkandidaten.
4. Ein frischer `security_privacy_reviewer` prueft read-only Storage-,
   No-Request-, Originalsprachen- und Rollbackgrenzen.
5. Erst danach prueft ein frischer `visual_accessibility_reviewer` den
   unveraenderten Kandidaten mit der gesamten funktionalen und visuellen Matrix.

Katalogarbeit darf nur bei disjunktem Dateieigentum parallel erfolgen. Keine
parallele Schreibarbeit an Vertrag, Clients, Storageadapter oder Tests.
Technisches GREEN ersetzt keine sichtbare Product-Owner-Abnahme.

## Akzeptanzkriterien

1. Erststart beider Clients: `en`, ohne automatischen Storagewrite.
2. Alle neun IDs sind auswählbar und besitzen vollstaendige schluesselgleiche
   lokale Kataloge ohne deutsche oder englische Resttexte in den gebundenen
   Shellbereichen.
3. Jede gueltige Auswahl ist nach Unmount, Reload und neuem Oeffnen desselben
   Clients aktiv.
4. App- und Website-Key mutieren einander nicht.
5. Invalid/unknown/getItem-Fehler: ehrliches `en`, keine Exception, kein
   automatisches Ueberschreiben des Rohwerts.
6. setItem-Fehler: weiter bedienbare Sitzung, keine falsche Persistenzbehauptung.
7. `<html lang>` und zugänglicher Selectname stimmen mit der aktiven UI-Sprache
   ueberein; `dir` bleibt `ltr`.
8. Header bleibt bei 320 px, Querformat und 200 Prozent Reflow ohne
   Inhaltsverlust oder horizontalen Seitenoverflow.
9. Tastatur, Fokus, Screenreadername und 44-Pixel-Ziel sind GREEN.
10. Theme, Navigation, Reader, Discover, Archiv, Gespeichert und alle
    G3-002-bis-G3-012-Funktionen bleiben unveraendert funktionsfaehig.
11. Contentrevision, Hashes, IDs, `originalLanguage` und Inhaltsfilter bleiben
    vor/nach jedem Sprachwechsel byte- bzw. semantikgleich.
12. Null neue externe Requests, Cookies, Logs, Analytics, IndexedDB-, Cache-
    oder Service-Worker-Wirkung.
13. Format, Lint, Boundaries, Typechecks, Unit-/Contract-/Komponententests,
    beide Builds und voller Browserlauf sind GREEN.
14. Unabhaengige Reviews melden null offene Blocker, Highs, Mediums oder Lows.

## Visuelle Mindestmatrix

- Mobile: 320x568 Dark/en; 390x844 Pink/de nach Reload; 412x915 Light/pt oder
  fr; 844x390/ru oder el; 390x844 bei 200 Prozent Reflow.
- Website: 390x844, 600x960, 1024x800 und 1440x900; Dark, Light, Pink und
  Contrast mindestens einmal; lange lateinische sowie kyrillische/griechische
  Optionen sichtbar belegen; zusaetzlich 200 Prozent Reflow.
- Zustaende: ready, loading, empty, offline, error sowie Dialog-/Readerfluss.
- Pro Client ein beschrifteter Neun-Sprachen-Kontaktbogen und eine
  maschinenlesbare Runtime-/Storage-/No-Side-Effect-Matrix.

## Bewusst spaeter

- `WRN-G3-014`: der bisher als G3-013 vorgesehene Offline-/Cache-/Update-/
  Rollback-Slice; durch Product-Owner-Priorisierung umnummeriert, nicht gestartet;
- statische SEO-Landingpage-Shelllokalisierung;
- redaktionelle Inhaltsuebersetzung und `SEC-001`;
- echte Inhalte, Android-Native, Remote/CI und jede Releaseaktion.

## Startwortlaut

Historisches Startgate; nach PO-069 ist der Scope geschlossen. Die Abnahme
erteilt weder eine Nachbesserungs- noch eine Folgeimplementierungsfreigabe.

```text
START WRN-G3-013
```

END-CHECK: :)
