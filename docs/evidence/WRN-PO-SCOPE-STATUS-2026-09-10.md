# RC-MUST – deine vollständigen vereinbarten Erweiterungen

Stand: 26. September 2026. Diese Matrix ist die einzige operative Anforderungsliste
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
| ATLAS-01 / Beta | World Revolution Atlas: Länder erkunden und Quellen-Quiz, ohne Tracking oder zusätzliche Kosten | in Arbeit | Neuer PO-Auftrag 27.09.; Android-Beta unter „Mehr“ aus dem geprüften Quellenverzeichnis implementiert, 993/993 mobile Unit-Tests, Typ-/Lintprüfung und lokaler App-Build bestanden. Die Browser-Vorschau zeigte nach Duplikatbereinigung 134 erfasste Quelleneinträge, deutsches UI und ein korrektes Quiz; unsigniertes AAB mit 108/108 Assets geprüft. Exakter nativer Installations-/Upgrade-Test, Signatur/Play und Website-Parität offen. Die alte Ereigniskarte ist wegen externer Datenflüsse nicht blind eingebettet; Website-Offline-Shell darf 8 MiB nicht überschreiten. [Atlas-Bericht](WRN-V13-ATLAS-BETA-2026-09-27/REPORT.md). |
| UI-01 / 5 | Schwarzer Hintergrund; Violett/Rot Standard, Rot/Cyan auswählbar; rote Buttonränder und rote Auswahlfüllung | geschlossen | 86751a86 korrigiert die alte #0b1017-Abweichung zu echtem Schwarz in Default/Violett und statischen Landings; beide finalen Clients unabhängig geprüft, Cyan erhalten. |
| UI-02 / 5 | Themes unter „Mehr“, kleiner Website-Link im App-Header, schließbarer Website-Hinweis auf kostenlose Nutzung und freiwillige Unterstützung | geschlossen | HEADER-SUPPORT-2026-09-13 unabhängig PASS nach zwei korrigierten Findings; beide Clients/neun Sprachen/320px/Theme-Persistenz, Dialog-Fokus und drei axe-Prüfungen bestanden. Keine Vorabverbindung zu Zahlungsanbietern; bestehender freiwilliger Projektlink. |
| UI-03 / 5 | Besprochene zusätzliche Schwarz/Rot-Magazinansicht nach PO-Bildvorlage unter Erhalt aller Funktionen | geschlossen | 86751a86, EDITORIAL-THEME-2026-09-13 unabhängig PASS; 20 Pfade, beide finale Builds, neun Sprachen, 320/1280px, vier axe-Prüfungen und queryfreie Persistenz2/2. Sechs Artikel/vier Bilder bytegleich, Magazinansicht unter Mehr. |
| UI-04 / 5 | Vorausgewählte Sprache auch beim Wechsel vom App-Header zur Website berücksichtigen | geschlossen | fba76c51, LANGUAGE-HANDOFF-2026-09-13 unabhängig PASS, neun Sprachen im gebauten Browserclient einschließlich erstem Unterstützungsdialog, URL-Bereinigung und explizitem Sprachwechsel/Reload bestanden. 0 externe Requests/Seitenfehler; Mehrfachwerte und Reader-/History-Erhalt unabhängig geprüft. |
| UI-05 / 5 | Kompakter Header nach Bildvorlage: links Mehr-Hamburger, mittig Textmarke in Themefarben, rechts echte Suche und darunter Sprachkürzel | geschlossen | COMPACT-HEADER20.09. und Pre-Play-RC25.09.: beide Clients, neun Sprachen/drei Themes/fünf Breiten, Suchfokus/Treffer, Mehr, Sprachpersistenz, Header-Axe und 200%-Reflow bestanden. Der Header ist im receiptgebundenen AAB aus b981c676 enthalten. |
| DATA-01 / 4 | Inhalte und Quellen der alten App übernehmen, neue Bereiche ergänzen | in Arbeit | Aktueller Metadaten-Dry-run25.09. am Commit936b3bae:958 sichere Nachrichtenverweise,532 Quellen und3 Sportnotizen;16 HTTP-Nachrichten,9 HTTP-Quellen und5 problematische Metadatensätze abgewiesen. Lokaler V8-Kandidat: zwölf vollständige Artikel/sieben einzeln belegte Bilder; unabhängige Rechte-/Inhaltsprüfung der zwei neuen Beiträge nach Hashkorrektur PASS. Neun Sportquellen und31 zusätzliche Fan-/Netzwerkquellen; getrenntes öffentliches GitHub-Repository vorhanden. Dauerhafte Volltextversorgung bleibt offen. |
| KNOW-01 / 5 | Bibliothek/Lexikon übernehmen und ergänzen | geschlossen | 609 Bücher/22 Begriffe lokal erreichbar; unabhängiger Abschluss1f003a2/ebd275f/e5b29c1. Keine aktuelle Rechte-/Verfügbarkeitsgarantie für jedes externe Werk behauptet. |
| HELP-01 / 5 | Hilfe/Solidarität aus Alt-App übernehmen und ergänzen | geschlossen | 11 Hilfsangebote/30 historische Solidaritätsprofile erreichbar; a2fb524 unabhängig geprüft, historische Hinweise kenntlich. |
| READ-01 / 5 | Echte Artikel mit Originalbildern an ihrer Position, Quellen-/Lizenz-/Alternativtexten und sauberem Reader | geschlossen | Der abgeschlossene Readervertrag ist in beiden Clients erreichbar; lokaler V8-Kandidat mit zwölf Originalartikeln/sieben einzeln belegten Bildern. Italienischer C4SS-Beitrag mit20 Originalabsätzen/Übersetzerangabe; drei AIAC-Sportbildbeiträge mit Pexels-/Commons-Einzelbelegen, deren unabhängige Abnahme für die zwei neuen Beiträge PASS ist. Weitere Artikel ohne aufgenommenes Bild; keine ungeklärten Rechte erfunden. |
| HOME-01 / 5 | Aufmacher, fünf kompakte Meldungen, Sport, Termine und weitere Nachrichten | geschlossen | V8 projiziert zwölf Artikel als 1 Aufmacher, 5 kompakte, 2 weitere Nachrichten und 3 bildgestützte Sportvolltexte; ein vierter Sportvolltext bleibt im Reader/Discover. Sport steht vor fünf aktuellen, quellgebundenen Regionalterminen; App und Website binden dieselbe Navigation. Gezielte Home-/Offline-Browserfälle 14/14 PASS; die unabhängige Prüfung der zwei neuen Beiträge ist PASS; laufende Veröffentlichung bleibt in SPORT-01. [V8-Beleg](WRN-SPORT-1PLUS2-2026-09-26/REPORT.md). |
| SPORT-01 / 4+5 | Sport & Fankultur nach Hauptmeldungen vor Terminen:1 großer+2 kleine bildgestützte Einträge, Kategorien/Alle-Sport-Link, kein Horizontal-Scroll/Aufmacherduplikat | in Arbeit | V8: vier vollständige AIAC-Sportbeiträge in beiden Readern; drei mit lokalen, einzeln belegten Originalbildern als 1+2 auf Home. Die zwei neuen Volltexte bringen 28+23 Originalabsätze und Commons-Fotos mit CC0/CC BY 4.0; der ältere bildlose Beitrag bleibt erreichbar. Neun Sportquellen, FSGT-/AIAC-Feedlinks. Unabhängiger Rechte-/Inhaltsreview der zwei neuen Beiträge nach Hashkorrektur PASS; laufende Veröffentlichung offen. [V8-Beleg](WRN-SPORT-1PLUS2-2026-09-26/REPORT.md). |
| SPORT-02 / 4 | Internationale/mehrsprachige Sportquellen mit feministischer, bewegungsnaher Perspektive, Fußball/Ultras/Fankultur und breiterem Sport | geschlossen | Lokal erreichbar sind 9 Hauptquellen und 31 zusätzliche Fan-/Netzwerkquellen in 7 Originalsprachen aus allen 6 bewohnten Kontinenten, mit den geforderten Perspektiven und Kategorien. Die geprüften offiziellen Selbstbeschreibungen werden zurückhaltend klassifiziert; `directoryOnly` behauptet weder Feedprüfung noch Volltextrechte. Sportquellentests App/Website 4/4+1/1. Artikel-/Bildaufnahme bleibt in SPORT-01. [Abschlussaudit](WRN-RC-MATRIX-CLOSURE-AUDIT-2026-09-25/REPORT.md). |
| PREF-01 / 3 | Explizite lokale Interessen/Regionen/Inhaltssprachen; Quellen folgen/ausblenden, Profile, Verwaltung/Rücknahme | geschlossen | Produktiv in beiden Clients geprüft. Folgen priorisiert; ausgeblendete Quellen verschwinden aus normalen Listen. Gemerkte Artikel und Direktlinks bleiben erreichbar. V10 korrigiert die belegte `sports`→`sport`-Zuordnung und kanonische Index-IDs; Personalisierung11/11, gezielter Browsernachlauf62/62, Workspace-Check und unabhängiger Review PASS. [Korrekturbeleg](WRN-V10-PERSONALIZATION-2026-09-26/REPORT.md). |
| PREF-02 / 3 | „Warum sehe ich das?“ nur bei personalisierten Karten unter „Für mich“, aus wirklichen lokalen Entscheidungen | geschlossen |8f8beb85 unabhängig bestätigt:58 betroffene Mobile-/9 Copy-/4 Browserfälle,38 Prüfbilder; keine neuen Requests oder Profilbildung. |
| PREF-03 / 3 | „Seit deinem letzten Besuch“ aus neu verfügbaren Beiträgen gewählter Themen/Regionen/Quellen, nur „Für mich“, lokal ohne Tracking | geschlossen | Beide Produktclients erreichbar; RC3/INDEPENDENT-REVIEW.md PASS nach31 gezielten/6 echten IDB-Browserfällen und3+1 unabhängigen Fehlerreproduktionen. Anonyme Startseite bleibt unpersonalisiert. |
| DISC-01 / 5 | Kompaktes Entdecken, deterministische lokale Suche/Filter nach Region, Thema/Strömung, Quelle, Originalsprache und Format | geschlossen | Produktive lokale Suche mit fünf kombinierbaren Filtern, kompaktem Bereich und Reset. Normalisierung, stabile Reihenfolge, kombinierte Facetten und fail-closed Indexbindung 22/22; App-UI im fokussierten 27/27-Paket. Quellenprofile und Verzeichnisfacetten verbleiben in SRC-01 bis SRC-03 und blockieren den eigenständigen Discover-Vertrag nicht. [Abschlussaudit](WRN-RC-MATRIX-CLOSURE-AUDIT-2026-09-25/REPORT.md). |
| SRC-01 / 4+5 | Aktive kuratierte Quellen zuerst; vollständige Liste separat, nach Weltregion/Land, Thema/Strömung und Medium auffindbar | geschlossen | Drei kanonische aktive Quellenprofile stehen in beiden Clients vor der getrennten vollständigen Liste mit 532 unveränderten Endpunkt-IDs. Suche, Sprache, Weltregion, Land, Thema/Strömung und Medium filtern beide Bereiche; ungültiges Overlay fällt geschlossen auf die Vollliste zurück. Mobile 944/944, Website 155/155+69/69, unabhängiger Korrekturreview PASS. [Quellenpass-Beleg](WRN-SOURCE-PASS-OVERLAY-2026-09-25/REPORT.md). |
| SRC-02 / 4 | Quellenpass: Selbstbeschreibung von Redaktion trennen, Alias/Nachfolger/stabile ID, Regionen/Sprachen, Feedgesundheit, letzter erfolgreicher Stand, Rechte je Medium | geschlossen | Für die tatsächlich kuratierten Profile EFF, C4SS und Africa Is a Country vollständig: stabile kanonische IDs, sichtbare Aliasse, getrennte Selbst-/Redaktionsbeschreibung, Facetten, zeitlich belegter Homepagezustand, ehrlich ungeprüfte Feeds und sichtbare Rechte je Medium mit Einzelprüfungsvorbehalt. Weitere Kandidaten bleiben allein in SRC-04 offen. Vertrag 475/475, unabhängiger Korrekturreview PASS. |
| SRC-03 / 4+5 | Logo mit belegtem Recht, sonst neutrale Initialen; Original und offiziell öffentlicher Korrekturkontakt; sichere Auslieferung/Privacy | geschlossen | Für dieselben drei kuratierten Profile sind mangels separatem Logorecht neutrale Initialen aktiv; Original- und verifizierte öffentliche Kontaktlinks nutzen HTTPS, `noopener noreferrer` und `no-referrer`. Keine privaten Kontaktdaten oder neuen Anzeigeabrufe. SRC-04 erweitert diesen Bestand später. Unabhängiger Korrekturreview PASS. |
| SRC-04 / 4 | Angenommene internationale Quellergänzungen einschließlich Black Liberation/Westasien vollständig prüfen und aufnehmen | in Arbeit | 16 belegte internationale Direktprofile ergänzen die bisherigen drei: 19 Profile/22 Endpunkte in App und Website, 532 Alt-IDs unverändert. Nur Metadatenlinks, keine unbelegten Volltext-/Bild-/Logo-/Feedrechte. Kumulativer, mehrtabfester Widerruf und Online-Erstrender nach Widerrufsversuch; rev2→rev1 im Packager abgewiesen, rev2→rev3 angenommen. Android frisch offline mit allen Karten geprüft, unabhängiger Sicherheitsreview PASS. Website frisch offline nur drei Profile innerhalb des unveränderten 8-MiB-Shell-Limits; weitere ungeklärte Kandidaten und Live-Widerrufsprobe bleiben offen. [Beleg](WRN-SRC04-GLOBAL-SOURCES-2026-09-25/REPORT.md). |
| SAVE-01 / 5 | Merken, Lesestatus/Leseposition, zuverlässiges Offline-Weiterlesen | geschlossen | Produktiv in beiden Clients und Offline-Neustart geprüft; zusätzliches Podcastresume gehört MEDIA-01. |
| TRANS-01 / 5 | Bewusst ausgelöste absatzweise Inlineübersetzung, Original sichtbar, Abbruch/Zeitlimit/Datenschutz | in Arbeit | Reader und lokaler Dienst unabhängig geprüft c239aec4; identische parallele Cache-Misses nun pro Serviceinstanz zusammengeführt,28 Tests und unabhängiger Review PASS. Gemini-REST-Adapter mit einem Versuch, Token-/Antwortlimits und Streamabbruch ergänzt; gesamte Dienstsuite36/36 bestanden. Externer Übersetzungsanbieter noch nicht aktiviert; kostenlose Schlüsselbindung ausstehend. |
| TRANS-02 / 4+5 | Übersetzte Starttitel nur aus vorhandener Übersetzung oder kontrolliert kostenfreiem Cache, sonst Original | in Arbeit | Original-Fallback vorhanden; tatsächliche Übersetzungsversorgung/Cacheparität noch zu vervollständigen. |
| MEDIA-03 / 2 | Bestehende Azure-Podcast-Erstellung der alten App übernehmen, Volltext/Kurzfassung und neun Sprachen erhalten | in Arbeit | PO20.09. bestätigt Azure F0. Sichere Übernahme mit kanonischen Artikeln, Zustimmung, gemeinsamem Kontingent und kontrollierter Speicherung in Umsetzung; keine aktive Providerbindung oder Live-Erstellung behauptet. |
| MEDIA-04 / 2+5 | Artikel direkt vorlesen lassen, ohne ungefragte Übertragung von Artikeltext | geschlossen | App und Website bieten lokales Artikel-TTS mit Gerätestimmen, Start/Pause/Fortsetzen, Tempo- und Stimmenwahl. Nur ausdrücklich als lokal gemeldete Stimmen werden angeboten; Wechsel von Artikel, Revision, Sprache, Stimme oder Tempo beendet die alte Wiedergabe. Die optionale Online-Podcast-Erstellung erscheint ausschließlich bei exakt konfiguriertem HTTPS-Endpunkt und bleibt derzeit deaktiviert. |
| MEDIA-01 / 1+2 | Produktiver Podcast/Audio/Radio/Video-Hub, exakte Pause-/Fortsetzenposition, neue Episoden erkennen | in Arbeit | A1–A7 unabhängig geprüft. Sichtbare EFF-Folge und Consent in beiden Builds; First-Boot2/2 echte IDB-Fälle mit FakeAudio, Pause/Continue/Resume23.456s und dauerhaftem Clear. Echter Browserstream/Pausieren13.09. in beiden Clients bestätigt; Native EFF-Audioverarbeitung/Pause14.09. bestätigt; Radio, weitere Episoden und laufende Versorgung bleiben offen. |
| MEDIA-02 / 2 | Echte Quellen-/Rechte-/Privacy-/CORS-/CSP-Aufnahme und bewusste Wiedergabe ohne Autoplay/Downloadversprechen | in Arbeit | EFF-Quelle und exakte Providerpolicy unabhängig PASS; lokale Aufnahme/CSP/Consent integriert,0 Providerrequests vor Bestätigung. Echter Browser-MP3-Stream/Pausieren inzwischen bestätigt; Native EFF-Stream/Pause14.09. bestätigt; finaler Medienabschluss offen; RC-MEDIA/REPORT.md bindet Grenzen. |
| VIDEO-01 / 2 | Die11 angenommenen Kanalvorschläge einschließlich DerDaraUncut integrieren | geschlossen | In beiden Verzeichnissen erreichbar,2b4a303/694fc16 unabhängig geprüft. Kein ungeprüfter Einzelclip als kuratiert behauptet. |
| VIDEO-02 / 2+4 | Sinnvolle geprüfte Einzelvideos/Shorts und laufender Medienbestand | in Arbeit | Zwei konkrete Original-URLs mit Titel/Kanal-Zuordnung (Dara-Short und Andrewism-Erklärvideo) sind in App und Website sprachgefiltert erreichbar; Browserprobe ohne Drittrequests vor dem Klick. Ein inhaltlicher Einzel-Faktencheck, weitere Sprachen und laufende kuratierte Versorgung fehlen; keine Einbettungs-/Offline- oder Rechtebehauptung. [Beleg](WRN-VIDEO-02-LINK-PILOT-2026-09-25/REPORT.md). |
| EVENT-01 / 4+5 | Fünf kuratierte regionale Termine nach Kontinent/Land/Region; lokale Auswahl ohne Standorterfassung | geschlossen | Revision3 enthält fünf aktuell belegte Termine in fünf Regionen, vier Ländern und drei Kontinenten. Auswahl und Persistenz bleiben lokal ohne Standortzugriff; Rohbytes sind exakt gehasht und bis02.10.2026 gültig. 16/16 Browserfälle mit beiden Clients, Themes, Reflow, Tastatur, Axe und IDB-Zuständen bestanden. Regelmäßige Erneuerung wird unter OPS-02 geführt. |
| UPDATE-01 / 3+4 | Hinweise, wenn ein bereits gelesener Artikel wesentlich korrigiert/aktualisiert wurde | in Arbeit | Lokale frühere Fassungsfingerprints und exakte Bestätigung integriert/geprüft. Belegte wesentliche Änderungs-/Korrekturmetadaten aus RC4 fehlen weiterhin; Hashwechsel ist kein Korrekturbeweis. |
| NOTIFY-01 / 3 | Freiwillige lokale Benachrichtigungen für ausdrücklich gewählte Quellen/Themen/Regionen, Zustimmung und Ruhezeiten | in Arbeit | Browserfunktion bei sichtbarer geöffneter Ansicht unabhängig PASS mit Fake-Notification/Quiet/Dedup/Clear. Keine echte Nutzer-/OS-Erlaubnis aktiviert. Native Hintergrundzustellung bleibt offen. |
| OPS-01 / 4 | Bestehende Alt-Workers/APIs/Daten-/Update-/Übersetzungsdienste prüfen, übernehmen und versioniert anbinden | in Arbeit | Backend-Intake übernimmt den500erFeed am exakten Commit; verlustfreier Append und redaktionelle Volltextaufnahme bleiben getrennt. Der neue Metadatenlauf bindet Status, Feed und Quellenregister an denselben Commit, prüft Freshness, Hash, stabile IDs und Vertrag und bestand real am Commit936b3bae. Cloudflare read-only geprüft. Kein zweiter Crawler. Automatische Volltextaufnahme bleibt absichtlich reviewgebunden; Produktionsveröffentlichung und Betriebsbeobachtung sind offen. |
| OPS-02 / 4 | Laufende Inhalte mit Herkunft/Rechten, stabile IDs, Freshness, Revocation/Offline/Rollback und regionaler Erneuerung | in Arbeit | V3-Vertrag bis64 Artikel; zwölf im lokalen V8-Kandidaten aktiv. Der6h-GitHub-Lauf erzeugt das unveränderliche Metadaten-/Link-Verzeichnis als Dry-run; letzter lokal gebundener Snapshot `202609251928` mit958 Nachrichtenlinks,532 Quellen und3 Sportnotizen. V8-Website-/Hosting-Dry-run44/44 und47/47 rückverifiziert, Zeiger zuletzt. Vorige Host-Widerrufsprovenienz, Live-CORS/Cache/Widerrufsprobe, dauerhafte Volltextaufnahme und authentisierte Aktivierung bleiben offen. [V8-Hosting-Beleg](WRN-V8-HOSTING-LOCAL-2026-09-26/REPORT.md). |
| WEB-01 / 5 | Volle App-/Website-Parität, neun Sprachen, Navigation/Suche/Reader/Links und beiderseitiger Offlinebetrieb | in Arbeit | Gemeinsame Module und derselbe V8-Inhaltsstand mit zwölf Artikeln/sieben Bildern in beiden Clients; fokussierte Home-/Offline-Browserfälle14/14 PASS und V8-Websitepaket44/44 rückverifiziert. Die vollständige finale Paritätsmatrix aller MUST-IDs bleibt Pflicht. [V8-Inhalt](WRN-SPORT-1PLUS2-2026-09-26/REPORT.md), [V8-Websitepaket](WRN-V8-HOSTING-LOCAL-2026-09-26/REPORT.md). |
| AND-01 / 5+6 | Native Androidmarke/Brücken, sichere Datenübernahme, Deep Links, Offline/Lifecycle/Gerät und echtes Upgrade | in Arbeit | V8-Testkandidat wegen fehlender alter Merkliste/Theme-Übernahme ersetzt. Exaktes AAB aus `4cfaafd`: 2.2.0/Code27/Target36, 108/108 receiptgebundene Assets und `pnpm check` PASS. Getrennte Testsignatur für Interne App-Freigabe und JKS-Signatur mit Zertifikat wie 2.1.1, JAR-/Assetprüfung PASS; Play-Akzeptanz unbestätigt. Auf frisch geleertem Test-AVD blieb beim direkten `install -r` von 2.1.1/26 das ausdrücklich gewählte Theme Pink erhalten, ohne Änderung der `firstInstallTime`. V9 zeigte zusätzlich alte Sprache und Merkliste/Offline-Text, aber der vollständige exakte V10-Fall, finale Gerätematrix und Pre-Launch bleiben offen. [V10-Android-Beleg](WRN-V10-ANDROID-UPGRADE-2026-09-26/REPORT.md). |
| QA-01 / 6 | Ein unveränderlicher RC mit vollständiger Workspace-/Browser-/Android-/Website-Matrix, Privacy/Rechten, Performance und Accessibility | in Arbeit | Für V8 sind `pnpm check` (Mobile 952/952, Website 155/155 + 71/71 Paketfälle, Content 81/81), beide Builds, Home-/Offlinefälle 14/14, zusätzliche Inhalts-/Personalisierungsfälle 91/91, Home-Matrix 5/5, IndexedDB-Schutz-Wiederholung 10/10, Hosting-Pakettests 13/13 und unabhängige Rechteprüfung PASS; Original-AAB 108/108 Assets verifiziert. Frühere sieben-Projekte-Browser- und Geräteproben betreffen ältere Produktstände. Die vollständige finale V8-Browsermatrix läuft; datenerhaltender Upgrade-Test, Live-Host-/Providerproben und PO-Sichtabnahme fehlen. Kein Gesamt-GREEN. [V8-Inhalt](WRN-SPORT-1PLUS2-2026-09-26/REPORT.md), [AAB-Testfreigabe](WRN-V8-INTERNAL-SHARING-2026-09-26/REPORT.md). |
| RELEASE-01 / 6 | Erreichbare Sichtprobe/PO-Abnahme, signiertes Release, echtes Play-Upgrade, Hosting/Headers/Rollback | offen | V8-AAB ist durch den korrigierten Kandidaten `4cfaafd` ersetzt. Ein lokal testsigniertes AAB für **Interne App-Freigabe** und eine getrennte mit der PO-JKS signierte AAB sind bereit, nicht hochgeladen; Zertifikat wie 2.1.1, Play-Akzeptanz unbestätigt. Der direkte 2.1.1→2.2.0-Test auf einem frisch geleerten AVD belegt Theme-Persistenz und unveränderte `firstInstallTime`, noch nicht die ganze Daten-/Gerätematrix. Der frühere vollständige Browserlauf hat 83 FAIL bei 2001 PASS/1598 SKIP. Das V8-Website-/Hostingpaket ist mit 44/44 und 47/47 Dateien rückverifiziert, verwendet jedoch nur den lokalen vorigen Widerrufssnapshot; aktiver Live-Zeiger und zuletzt ausgelieferter Host-Widerrufsstand sind nicht belegt. Finale RC-Matrix, PO-Sichtabnahme, Play-Pre-Launch und Veröffentlichung bleiben offen. Kein Push, Hosttransfer oder Play-Upload. [V10-AAB-Test](WRN-V10-ANDROID-UPGRADE-2026-09-26/REPORT.md), [V8-Hosting](WRN-V8-HOSTING-LOCAL-2026-09-26/REPORT.md). |

Aktualisierung 26.09. für QA-01 und RELEASE-01: Der Sport-Personalisierungsfix
`a4cbbff` bestand `pnpm check`, beide Builds, 11/11 Personalisierungs- und
62/62 gezielte weitere Browserfälle. Das neue offline gebaute AAB enthält
108/108 receiptgebundene Assets; eine getrennte Testsignatur für Interne
App-Freigabe ist vorhanden. Der ältere JKS-signierte AAB enthält den Fix noch
nicht. Die 83 Fehler stammen aus dem vorherigen Browserlauf; die volle neue
Matrix ist weiter offen. [Aktueller Beleg](WRN-V10-PERSONALIZATION-2026-09-26/REPORT.md).

Signaturnachtrag 26.09.: Ein **neueres** mit der PO-JKS lokal signiertes AAB
enthält `a4cbbff` einschließlich Sport-Fix: `com.world.revolution`, 2.2.0/
Code27, 108/108 Assetprüfung und `jarsigner -verify` Exit0. Der Fingerabdruck
stimmt mit den verfügbaren alten Upload-AABs überein. Ob Play diesen Schlüssel
aktuell registriert hat, ist jetzt durch schreibgeschützten Play-Console-Abgleich
bestätigt. Play-Annahme des AAB und Geräte-Upgrade bleiben ungetestet; kein
Upload oder Release-GREEN.
[Signaturbeleg](WRN-V11-SIGNED-AAB-2026-09-26/REPORT.md).
[Play-Abgleich](WRN-V11-PLAY-UPLOAD-CERT-2026-09-26/REPORT.md).

Testnachtrag 26./27.09. für QA-01 und RELEASE-01: Das vollständige
`mobile-390x844`-Projekt aus dem aktuellen Produktstand bestand 485/485 aktive
Fälle, mit 41 vorgesehenen Skips; die sechs übrigen Browserprojekte bleiben
offen. Die separate `.rc`-Test-AAB wurde auf dem geschlossenen Track der
bestehenden App erwartungsgemäß wegen abweichenden Uploadschlüssels
abgewiesen. Sie ersetzt die Live-App nicht. Der direkte Paralleltest nutzt die
separate APK; ein späterer echter Play-Upgrade benötigt die JKS-signierte
Haupt-AAB und einen kontrollierten Testtrack.
[Mobiler Testbeleg](WRN-V11-MOBILE-BROWSER-2026-09-26/REPORT.md),
[Play-Befund](WRN-V11-PLAY-UPLOAD-CERT-2026-09-26/REPORT.md).

Hostingnachtrag 26.09. für OPS-02, WEB-01, QA-01 und RELEASE-01: Der aktuelle
Produktstand `a4cbbff` ergab eine frische Website mit zwölf Artikellandings,
44/44 rückverifizierte Webdateien und ein kombiniertes Paket mit 47/47 Dateien;
die beiden Pointer stehen zuletzt. Der vorige Widerruf ist weiterhin nur lokal
belegt und der Verzeichnisstand stammt vom 25.09. Deshalb bleibt der Status
**in Arbeit/offen**: kein Live-Transfer, keine laufende Volltextversorgung,
keine finale Host-/Rollbackprobe. Alle drei festen öffentlichen Pointer lieferten
am26.09. beim GET HTTP404/HTML. Die Offline-Shell hat nur 4.308 Byte Spielraum
unter dem derzeitigen Limit. [Aktueller Dry-run](WRN-V11-HOSTING-LOCAL-2026-09-26/REPORT.md).

Störungsnachtrag 27.09. für OPS-01/02 und RELEASE-01: Das alte Backend hatte
am 26.09. 19:48 UTC noch erfolgreich 500 Meldungen erzeugt, aber der geplante
Aktualisierungstakt war im beobachteten Fenster unregelmäßig. Ein Artikel mit
Datum 01.10. steht als vermeintlich neuester Eintrag oben. Der offene PR38
korrigiert nur das Statusdatum. Der aktuelle neue Versorgungs-Dry-run wartet
bei 499 Kandidaten auf Aufnahmeprüfung; alle drei neuen Host-Pointer bleiben
404. Somit keine laufende neue Versorgung und kein Release-GREEN.
[Live-Feed-Befund](WRN-LIVE-FEED-INCIDENT-2026-09-26/REPORT.md).

Die ausdrücklich entfernte **„Globale Lage“ bleibt entfernt** (PO092).
Ausdrücklich später vorgemerkte Wünsche bleiben sichtbar erhalten, ohne sie
unbemerkt in ein bestehendes MVP hineinzudeuten: World Revolution Map, Zine und
Action Radar; Status jeweils **offen**. Artikel-TTS ist als MEDIA-04 umgesetzt.
Neu vorgemerkt am 27.09.: **eigene Medienportal-Links lokal auf dem Gerät
speichern und wieder öffnen**, mit Bearbeiten und Entfernen, ohne Konto oder
Server-Synchronisierung; Status **offen**, kein Blocker des aktuellen
Play-AAB. Persönliche Links bleiben von redaktionell geprüften Quellen
getrennt und dürfen keine automatische Quellen-, Rechte- oder
Inhaltsprüfbehauptung erzeugen. Die sichere URL-Aufnahme, Persistenz,
Datenexport/-löschung und Offline-Grenze werden vor Umsetzung gebunden.
Die bestehende spätere Einstufung der übrigen Wünsche bleibt bestehen. Konten, Kommentare und
allgemeine Gamification werden ohne neue PO-Entscheidung nicht hinzugefügt.
Die Atlas-Beta ist seit dem ausdrücklichen PO-Auftrag vom 27.09. die eng
begrenzte Ausnahme; Konten, Ranglisten und gespeicherte Spielstände bleiben
ausgeschlossen.

Testnachtrag 26.09.: **WRN Test** (`com.world.revolution.rc`) liegt als
separates AAB und APK bereit; Emulator-Parallelbetrieb ersetzt die Haupt-App
nicht. Der kontrollierte lokale 2.1.1→2.2.0-Upgrade-Test erhielt die zuvor
ausdrücklich gewählte Sprache FR und die ursprüngliche `firstInstallTime`.
Ein zweiter frischer AVD-Test des aktuellen AAB erhielt einen in 2.1.1
gemerkten Offline-Volltext und das Pink-Theme; mehrere spätere Absätze blieben
nach Neustart im Flugmodus lesbar.
AND-01, QA-01 und RELEASE-01 bleiben **in Arbeit/offen** wie oben beschrieben:
vollständige Datenmigration, Play-signierter Upgradepfad, finale Matrix und
PO-Sichttest sind damit nicht abgeschlossen.
[Paralleltest](WRN-SIDE-BY-SIDE-TEST-2026-09-26/REPORT.md),
[Datenupgrade](WRN-V11-ANDROID-DATA-UPGRADE-2026-09-26/REPORT.md).

Aktuell erreichbar: [App43358](http://127.0.0.1:43358/?theme=violet#home) und
[Website43359](http://127.0.0.1:43359/?theme=violet&lang=de#home), lokaler V8-Inhaltsstand mit zwölf Artikeln. Themes unter Mehr,
App-Headerlink und freiwilliger Website-Unterstützungshinweis unabhängig PASS.
Medienintegration unabhängig PASS; beide finalen Builds mit neun UI-Sprachen,
Consent,Reflow und dauerhaftem Clear geprüft. Zwölf Artikel/sieben Bilder,
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
