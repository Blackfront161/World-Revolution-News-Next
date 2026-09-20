# RC-MUST – deine vollständigen vereinbarten Erweiterungen

Stand: 14. September 2026. Diese Matrix ist die einzige operative Anforderungsliste
für den Release Candidate. Status ausschließlich **offen**, **in Arbeit** oder
**geschlossen**. Geschlossen bedeutet erreichbare Produktfunktion plus belegte
Prüfung; es bedeutet keine persönliche Sichtabnahme oder Veröffentlichung.
Teilergebnisse schließen einen umfassenderen Wunsch nicht stillschweigend.

Grundlagen: [Original-G2-Auszug](WRN-REQUIREMENTS-G2-CHAT-EXCERPT-2026-09-10.md),
[PO-Entscheidungen](../06-DECISION-LOG.md),
[angenommener Gesamtabschluss](../tasks/WRN-RELEASE-COMPLETION-2026-09-10.md)
und neuere direkte Wünsche zu Migration, Bildern, Videos und Themes.
Die gesamte technische Altparität bleibt über
[Feature-Paritätsmatrix](../02-FEATURE-PARITY-MATRIX.md) verbindlich;
deren frühere Taskstände ersetzen keine Prüfung des tatsächlichen RC.

| ID / Paket | Dein Wunsch / Abschlussbedingung | Status | Tatsächlicher Stand / offener Teil |
| --- | --- | --- | --- |
| UI-01 / 5 | Schwarzer Hintergrund; Violett/Rot Standard, Rot/Cyan auswählbar; rote Buttonränder und rote Auswahlfüllung | geschlossen | 86751a86 korrigiert die alte #0b1017-Abweichung zu echtem Schwarz in Default/Violett und statischen Landings; beide finalen Clients unabhängig geprüft, Cyan erhalten. |
| UI-02 / 5 | Themes unter „Mehr“, kleiner Website-Link im App-Header, schließbarer Website-Hinweis auf kostenlose Nutzung und freiwillige Unterstützung | geschlossen | HEADER-SUPPORT-2026-09-13 unabhängig PASS nach zwei korrigierten Findings; beide Clients/neun Sprachen/320px/Theme-Persistenz, Dialog-Fokus und drei axe-Prüfungen bestanden. Keine Vorabverbindung zu Zahlungsanbietern; bestehender freiwilliger Projektlink. |
| UI-03 / 5 | Besprochene zusätzliche Schwarz/Rot-Magazinansicht nach PO-Bildvorlage unter Erhalt aller Funktionen | geschlossen | 86751a86, EDITORIAL-THEME-2026-09-13 unabhängig PASS; 20 Pfade, beide finale Builds, neun Sprachen, 320/1280px, vier axe-Prüfungen und queryfreie Persistenz2/2. Sechs Artikel/vier Bilder bytegleich, Magazinansicht unter Mehr. |
| UI-04 / 5 | Vorausgewählte Sprache auch beim Wechsel vom App-Header zur Website berücksichtigen | geschlossen | fba76c51, LANGUAGE-HANDOFF-2026-09-13 unabhängig PASS, neun Sprachen im gebauten Browserclient einschließlich erstem Unterstützungsdialog, URL-Bereinigung und explizitem Sprachwechsel/Reload bestanden. 0 externe Requests/Seitenfehler; Mehrfachwerte und Reader-/History-Erhalt unabhängig geprüft. |
| UI-05 / 5 | Kompakter Header nach Bildvorlage: links Mehr-Hamburger, mittig Textmarke in Themefarben, rechts echte Suche und darunter Sprachkürzel | geschlossen | COMPACT-HEADER20.09.: beide Clients, unabhängiger Delta-Review PASS; neun Sprachen/drei Themes/fünf Breiten, Suchfokus/Treffer, Mehr, Sprachpersistenz, Header-axe bestanden. Mobile909, Website148+65 und Typechecks PASS. Native APK enthält den Header noch nicht; AND-01 bleibt in Arbeit. |
| DATA-01 / 4 | Inhalte und Quellen der alten App übernehmen, neue Bereiche ergänzen | in Arbeit | 973 Nachrichtenverweise,532 Quellen-Endpunkte und3 Sportnotizen übernommen. Neun geprüfte Artikel/vier Bilder lokal aktiv. Neun Sportquellen und14 zusätzliche Fan-/Netzwerkquellen in zwei Verzeichnisteilen; getrenntes privates GitHub-Repository angelegt. Dauerhafte Volltextversorgung bleibt offen. |
| KNOW-01 / 5 | Bibliothek/Lexikon übernehmen und ergänzen | geschlossen | 609 Bücher/22 Begriffe lokal erreichbar; unabhängiger Abschluss1f003a2/ebd275f/e5b29c1. Keine aktuelle Rechte-/Verfügbarkeitsgarantie für jedes externe Werk behauptet. |
| HELP-01 / 5 | Hilfe/Solidarität aus Alt-App übernehmen und ergänzen | geschlossen | 11 Hilfsangebote/30 historische Solidaritätsprofile erreichbar; a2fb524 unabhängig geprüft, historische Hinweise kenntlich. |
| READ-01 / 5 | Echte Artikel mit Originalbildern an ihrer Position, Quellen-/Lizenz-/Alternativtexten und sauberem Reader | geschlossen | Acht Originalartikel/vier belegte Bilder in beiden Clients. Neuer italienischer C4SS-Beitrag mit20 Originalabsätzen/Übersetzerangabe, Browser/Offline-Remount geprüft; bisheriger Offline-Neustartbeleg bleibt auf seinem Stand. Vier Artikel ohne aufgenommenes Bild; keine ungeklärten Rechte erfunden. |
| HOME-01 / 5 | Aufmacher, fünf kompakte Meldungen, Sport, Termine und weitere Nachrichten | in Arbeit | 1+5 echte Nachrichten/vier Bilder und regionale Auswahl erreichbar. Siebter Artikel als weitere Nachricht erreichbar; vollständiges Sportmodul fehlt noch. |
| SPORT-01 / 4+5 | Sport & Fankultur nach Hauptmeldungen vor Terminen:1 großer+2 kleine bildgestützte Einträge, Kategorien/Alle-Sport-Link, kein Horizontal-Scroll/Aufmacherduplikat | in Arbeit | V6: erster vollständiger AIAC-Sportkommentar in beiden Readern und Sport-Startsektion;30 Originalabsätze, Atomdatum, CC-BY-Beleg, unabhängiger Review und Mehrfachkategorien geprüft. Neun Sportquellen, FSGT-/AIAC-Feedlinks. Sportbilder mit Einzelrechten, breitere Auswahl und laufende Veröffentlichung weiterhin offen. |
| SPORT-02 / 4 | Internationale/mehrsprachige Sportquellen mit feministischer, bewegungsnaher Perspektive, Fußball/Ultras/Fankultur und breiterem Sport | in Arbeit | Quellenvertrag und drei Belege vorhanden; breitere geprüfte Aufnahme und laufende Aktualisierung fehlen. Keine Live-Scores oder weltweite Vollständigkeit versprochen. |
| PREF-01 / 3 | Explizite lokale Interessen/Regionen/Inhaltssprachen; Quellen folgen/ausblenden, Profile, Verwaltung/Rücknahme | geschlossen | Produktiv in beiden Clients geprüft. Folgen priorisiert; ausgeblendete Quellen verschwinden aus normalen Listen. Gemerkte Artikel und Direktlinks bleiben erreichbar. |
| PREF-02 / 3 | „Warum sehe ich das?“ nur bei personalisierten Karten unter „Für mich“, aus wirklichen lokalen Entscheidungen | geschlossen |8f8beb85 unabhängig bestätigt:58 betroffene Mobile-/9 Copy-/4 Browserfälle,38 Prüfbilder; keine neuen Requests oder Profilbildung. |
| PREF-03 / 3 | „Seit deinem letzten Besuch“ aus neu verfügbaren Beiträgen gewählter Themen/Regionen/Quellen, nur „Für mich“, lokal ohne Tracking | geschlossen | Beide Produktclients erreichbar; RC3/INDEPENDENT-REVIEW.md PASS nach31 gezielten/6 echten IDB-Browserfällen und3+1 unabhängigen Fehlerreproduktionen. Anonyme Startseite bleibt unpersonalisiert. |
| DISC-01 / 5 | Kompaktes Entdecken, deterministische lokale Suche/Filter nach Region, Thema/Strömung, Quelle, Originalsprache und Format | in Arbeit | Produktive Suche20.09. mit fünf kombinierbaren Metadatenfiltern, kompaktem Filterbereich/Reset; Filterleck auf andere Routen korrigiert. Unabhängiger Review, Mobile911/Website148+65, beide Builds/neun Sprachen/Offline/axe PASS. Vollständige Verzeichnis-/Quellenkartenparität im RC bleibt abzugleichen. |
| SRC-01 / 4+5 | Aktive kuratierte Quellen zuerst; vollständige Liste separat, nach Weltregion/Land, Thema/Strömung und Medium auffindbar | in Arbeit | Historische Endpunktliste und Quellenwahl vorhanden; vollständige aktive Kuratierung/Filterparität fehlt. |
| SRC-02 / 4 | Quellenpass: Selbstbeschreibung von Redaktion trennen, Alias/Nachfolger/stabile ID, Regionen/Sprachen, Feedgesundheit, letzter erfolgreicher Stand, Rechte je Medium | in Arbeit | EFF/C4SS und weitere Belege teilweise vorhanden. Verzeichniszählung ersetzt keinen geprüften Pass. |
| SRC-03 / 4+5 | Logo mit belegtem Recht, sonst neutrale Initialen; Original und offiziell öffentlicher Korrekturkontakt; sichere Auslieferung/Privacy | in Arbeit | Teilweise Quellenprofile vorhanden; vollständige geprüfte Logos/Kontakte/Health fehlen. Keine privaten Kontakte sammeln. |
| SRC-04 / 4 | Angenommene internationale Quellergänzungen einschließlich Black Liberation/Westasien vollständig prüfen und aufnehmen | offen | Kandidaten/Scope dokumentiert; Feed-, Alias-, Rechte-, Stable-ID- und Aufnahmeprüfung bleibt nötig. |
| SAVE-01 / 5 | Merken, Lesestatus/Leseposition, zuverlässiges Offline-Weiterlesen | geschlossen | Produktiv in beiden Clients und Offline-Neustart geprüft; zusätzliches Podcastresume gehört MEDIA-01. |
| TRANS-01 / 5 | Bewusst ausgelöste absatzweise Inlineübersetzung, Original sichtbar, Abbruch/Zeitlimit/Datenschutz | in Arbeit | Reader und lokaler Dienst unabhängig geprüft c239aec4; identische parallele Cache-Misses nun pro Serviceinstanz zusammengeführt,28 Tests und unabhängiger Review PASS. Gemini-REST-Adapter mit einem Versuch, Token-/Antwortlimits und Streamabbruch ergänzt; gesamte Dienstsuite36/36 bestanden. Externer Übersetzungsanbieter noch nicht aktiviert; kostenlose Schlüsselbindung ausstehend. |
| TRANS-02 / 4+5 | Übersetzte Starttitel nur aus vorhandener Übersetzung oder kontrolliert kostenfreiem Cache, sonst Original | in Arbeit | Original-Fallback vorhanden; tatsächliche Übersetzungsversorgung/Cacheparität noch zu vervollständigen. |
| MEDIA-01 / 1+2 | Produktiver Podcast/Audio/Radio/Video-Hub, exakte Pause-/Fortsetzenposition, neue Episoden erkennen | in Arbeit | A1–A7 unabhängig geprüft. Sichtbare EFF-Folge und Consent in beiden Builds; First-Boot2/2 echte IDB-Fälle mit FakeAudio, Pause/Continue/Resume23.456s und dauerhaftem Clear. Echter Browserstream/Pausieren13.09. in beiden Clients bestätigt; Native EFF-Audioverarbeitung/Pause14.09. bestätigt; Radio, weitere Episoden und laufende Versorgung bleiben offen. |
| MEDIA-02 / 2 | Echte Quellen-/Rechte-/Privacy-/CORS-/CSP-Aufnahme und bewusste Wiedergabe ohne Autoplay/Downloadversprechen | in Arbeit | EFF-Quelle und exakte Providerpolicy unabhängig PASS; lokale Aufnahme/CSP/Consent integriert,0 Providerrequests vor Bestätigung. Echter Browser-MP3-Stream/Pausieren inzwischen bestätigt; Native EFF-Stream/Pause14.09. bestätigt; finaler Medienabschluss offen; RC-MEDIA/REPORT.md bindet Grenzen. |
| VIDEO-01 / 2 | Die11 angenommenen Kanalvorschläge einschließlich DerDaraUncut integrieren | geschlossen | In beiden Verzeichnissen erreichbar,2b4a303/694fc16 unabhängig geprüft. Kein ungeprüfter Einzelclip als kuratiert behauptet. |
| VIDEO-02 / 2+4 | Sinnvolle geprüfte Einzelvideos/Shorts und laufender Medienbestand | in Arbeit | Kanallinks vorhanden; konkrete Episode-/Clipaufnahme und fortlaufende Versorgung fehlen. |
| EVENT-01 / 4+5 | Fünf kuratierte regionale Termine nach Kontinent/Land/Region; lokale Auswahl ohne Standorterfassung | in Arbeit | Funktion unabhängig geprüft375574b5; fünf aktuelle Originalverweise insgesamt, fünf Regionen/drei Kontinente/vier Länder. Breitere Abdeckung und regelmäßige Erneuerung fehlen. |
| UPDATE-01 / 3+4 | Hinweise, wenn ein bereits gelesener Artikel wesentlich korrigiert/aktualisiert wurde | in Arbeit | Lokale frühere Fassungsfingerprints und exakte Bestätigung integriert/geprüft. Belegte wesentliche Änderungs-/Korrekturmetadaten aus RC4 fehlen weiterhin; Hashwechsel ist kein Korrekturbeweis. |
| NOTIFY-01 / 3 | Freiwillige lokale Benachrichtigungen für ausdrücklich gewählte Quellen/Themen/Regionen, Zustimmung und Ruhezeiten | in Arbeit | Browserfunktion bei sichtbarer geöffneter Ansicht unabhängig PASS mit Fake-Notification/Quiet/Dedup/Clear. Keine echte Nutzer-/OS-Erlaubnis aktiviert. Native Hintergrundzustellung bleibt offen. |
| OPS-01 / 4 | Bestehende Alt-Workers/APIs/Daten-/Update-/Übersetzungsdienste prüfen, übernehmen und versioniert anbinden | in Arbeit | Backend-Intake1e14a874 übernimmt vorhandenen500erFeed am gebundenen Commit,97 Quellnamen,11 markierte Textkonflikte;Verlustfreier Append/CLI mit18 Tests und32/32 betroffenen Backendfällen, unabhängiger Abschluss; acht geprüfte Artikel lokal aktiviert. Betriebsprüfung20.09.: nichtblockierende Budget-/Zukunftsdatumwarnungen; Altbackend-Freshnesskorrektur als PR38 mit zwei grünen GitHub-Prüfungen; Mergefreigabe ausstehend. Lokaler Runner mit echten awaiting-admission/no-change-Proben geprüft. Cloudflare read-only geprüft. Kein zweiter Crawler. Automatische V3-Aufnahme/Veröffentlichung und Betriebsnachweise weiterhin offen. |
| OPS-02 / 4 | Laufende Inhalte mit Herkunft/Rechten, stabile IDs, Freshness, Revocation/Offline/Rollback und regionaler Erneuerung | in Arbeit | V3-Vertrag bis64 Artikel,9 lokal aktiv;V6-Eingabe und Ledger6 gesichert, bestehende8 Artikel/4 Bilder unverändert. Altbackend stündlich/6h geprüft; neuer6h-Vorbereitungslauf ohne Veröffentlichung lokal vorhanden. GitHub-Ziel/Hostingaktivierung und regionale Erneuerung offen; NEWS-IDENTITY-H-001 weiterhin offen. |
| WEB-01 / 5 | Volle App-/Website-Parität, neun Sprachen, Navigation/Suche/Reader/Links und beiderseitiger Offlinebetrieb | in Arbeit | Gemeinsame Module/zahlreiche Teilprüfungen vorhanden; vollständiger RC-Abgleich aller MUST-Paritäts-IDs bleibt Pflicht. |
| AND-01 / 5+6 | Native Androidmarke/Brücken, sichere Datenübernahme, Deep Links, Offline/Lifecycle/Gerät und echtes Upgrade | in Arbeit | Neue unsignierte Acht-Artikel-APK ad8ad240 aus26127085/Produkt511c3749:85 exakte Assets,85 Quellpins,16 frisch ausgeführte JVM-Fälle,0 Lintfehler und unabhängiger Review PASS. Konkrete Testsignierung/Installation noch ausstehend. Aktuelle Medien/RC3/Themes/Sport enthalten; Testsignierung/Installation auf isolierter API36-AVD14.09. erfolgt: Offline-Reader, Sprache, echte EFF-Audioverarbeitung/Pause bestanden; Gerät/Upgrade und vollständige Native-Matrix weiter offen. |
| QA-01 / 6 | Ein unveränderlicher RC mit vollständiger Workspace-/Browser-/Android-/Website-Matrix, Privacy/Rechten, Performance und Accessibility | offen | Lokale Paketprüfungen sind kein Gesamt-GREEN. Große Chunks und äußere Betriebsgrenzen bleiben offen. PNPM-Workspace offline/frozen synchronisiert; reguläre Client-/Paketskripte und Toolchaincheck bestanden. |
| RELEASE-01 / 6 | Erreichbare Sichtprobe/PO-Abnahme, signiertes Release, echtes Play-Upgrade, Hosting/Headers/Rollback | offen | Lokale Vorschauen und unsignierte Artefakte vorhanden. Keine finale Sichtabnahme/Produktionssignatur/Playfreigabe oder Veröffentlichung erfolgt. |

Die ausdrücklich entfernte **„Globale Lage“ bleibt entfernt** (PO092).
Ausdrücklich später vorgemerkte Wünsche bleiben sichtbar erhalten, ohne sie
unbemerkt in ein bestehendes MVP hineinzudeuten: Artikel-TTS (PO038/SPAETER),
World Revolution Map, Zine und Action Radar; Status jeweils **offen**.
Ihre bestehende spätere Einstufung bleibt bestehen. Konten, Kommentare und
Gamification werden ohne neue PO-Entscheidung nicht hinzugefügt.

Aktuell erreichbar: [App43222](http://127.0.0.1:43222/?theme=violet#home) und
[Website43223](http://127.0.0.1:43223/?theme=violet&lang=de#home), lokale Inhaltsversion5. Themes unter Mehr,
App-Headerlink und freiwilliger Website-Unterstützungshinweis unabhängig PASS.
Medienintegration unabhängig PASS; beide finalen Builds mit neun UI-Sprachen,
Consent,Reflow und dauerhaftem Clear geprüft. Sechs Artikel/vier Bilder,
Auswahlerklärung und freiwillige Besuchsübersicht unter „Für mich“ erhalten.
Ältere Buildartefakte bleiben erhalten; deren Vorschauprozesse sind nach der
Unterbrechung nicht als laufend bestätigt. Ein unabhängiger Test ersetzt deine
Sichtabnahme nicht. Native654ca833 enthält die spätere Auswahlerklärung und RC3
noch nicht.

Die ursprüngliche Bildlücke lag im textbasierten Produktionsvertrag, einem
getrennten Testreader, fehlenden kompakten Startbildern und einer alten Vorschau.
Diese technischen Bildfehler sind korrigiert; zusätzliche Bilder benötigen
nachgewiesene Herkunft/Nutzungsrechte. [Bild-/Anforderungsabgleich](WRN-REQUIREMENTS-RECONCILIATION-2026-09-10.md).

Aktuelle Abschlussbelege:
[Auswahlerklärung](WRN-PRODUCTION-SELECTION-INDEPENDENT-2026-09-12/REPORT.md),
[A6-Medienspeicher](WRN-MEDIA-A6-COMBINED-CLOSURE-2026-09-12/REPORT.md),
[Inhaltsmigration](WRN-CONTENT-MIGRATION-RESULT-2026-09-09.md).
Die [vorherige vollständige Matrix mit historischen Prüfdetails](../history/WRN-PO-SCOPE-BEFORE-RC-WORKFLOW-2026-09-12.md)
ist bytegleich erhalten. Aktueller Paket-/Schreibstatus: [PROJECT-STATE](../PROJECT-STATE.md).
