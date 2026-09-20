# Azure-Podcastübernahme und Direkte Aktion

## Auftrag und Altbestand

PO20.09.2026: vorhandene Podcast-Erstellung übernehmen; Direkte Aktion nur ergänzen, falls noch nicht vorhanden. PO bestätigt anschließend ausdrücklich den Azure-Tarif F0. Dies ist eine Nutzerbestätigung, keine unabhängig gelesene Azure-Kontoprüfung.

Altcode: World-Revolution-News-App, Commit2216ff3c1305f6d474712892a36dc9b0ea7cb0a0, cloudflare/revolution-proxy/src/index.js, SHA-2560c216d7a12741d3128ef9640fbf6b96cdbf0fae1664476687e04aeef5782e4a5. Azure Speech REST,18 Stimmen in neun Sprachen, MP3, Inhaltscache, Cloudflare R2 und zentrale Quoten. Keine Amazon-Polly-Anbindung belegt. Die vorhandene Kurzfassung verwendet außerdem einen Sprachmodellaufruf; dieser darf keine unbemerkte neue Kostenquelle werden.

Microsofts Preisübersicht nennt am20.09.2026 für F0 Neural TTS500.000 Zeichen/Monat: https://azure.microsoft.com/en-us/pricing/details/speech/ . Die vorhandene Grenze475.000 bleibt der engere Puffer. Alte/neue App müssen bei derselben Azure-Ressource ein gemeinsames Kontingent verwenden. Keine Azure-/R2-Anfrage, kein Schlüsselzugriff und kein Deployment durch diese lokale Arbeit.

Die alte Podcast-Erstellung ist ausdrücklich von zusätzlichem lokalem Artikel-TTS zu unterscheiden. Die Übernahme darf den dokumentierten SEC-002-Pfad (frei gelieferter Text, anonyme Kosten und öffentlicher Katalog) nicht wieder öffnen. Kanonische Artikel, Freigaben, Zustimmung, gemeinsame Quoten und kontrollierte Veröffentlichung bleiben erforderlich.

## Direkte Aktion: bereits vorhanden, Suchfehler korrigiert

App und Website enthalten genau denselben Eintrag `source-22caccb55e3408dfec6b5f5d0d809b90b8d7701881a31ad216951a1009c5066f`, Name „Direkte Aktion (DE)“, URL https://direkteaktion.org/ . Originale Importprovenienz bleibt erhalten; kein doppelter Eintrag und keine neue Rechtebehauptung.

Die Quellensuche berücksichtigte bisher Namen und Sprachen, aber nicht die Domain. Beide Clients durchsuchen jetzt zusätzlich die kanonische URL; umgebende Leerzeichen und Groß-/Kleinschreibung werden normalisiert. Mobile beobachtete Namensvarianten und bestehende Filter bleiben erhalten.

Nachweis: Mobile3/3 und Website1/1 fokussierte Routentests bestanden, beide Typprüfungen und Builds erfolgreich. Unabhängiger Directoryreview PASS. Gebaute App43232 und Website43233 finden mit direkteaktion.org jeweils genau einen Eintrag; beigefügte Screenshots. Der Website-Test brauchte zunächst den korrekten JSON-Content-Type seines Mocks; der Produktionsschutz wurde nicht verändert.

Abschließende betroffene Gesamtsuiten: Mobile923/923, Website152/152 plus65/65 Node-Werkzeugtests bestanden. Website-Offlinegraph8.300.848 Bytes, SHA-256aa5964a59b6383391a986d52d6bab1244ad8ed682b66d7c5e54cff58ddd4214f.

Vorschauen: http://127.0.0.1:43232/?theme=violet#discover/sources und http://127.0.0.1:43233/?theme=violet&lang=de#discover/sources . Älteres AAB27 bleibt separat und enthält diese spätere Suchkorrektur noch nicht.

Spark wurde für die kleine Suchkorrektur versucht, aber vom Dienst als mit diesem ChatGPT-Konto nicht unterstütztes Modell abgelehnt. Root hat die eng begrenzte Korrektur übernommen; kein zweiter Agentenpool.

## Lokaler Dienst und verbleibende Integration

`services/podcast` übernimmt die belegten Azure-Stimmen und das MP3-Format als getrennten Dienst. Kanonische Artikel-ID, Revision, tatsächliche Textsprache und erneute Freigabeprüfungen vor Cacheausgabe und Speicherung verhindern eine Umgehung durch Browsertext. Volltext und redaktionell freigegebene Kurzfassung sind getrennt; keine automatische kostenpflichtige Zusammenfassung. Der Cache bindet Titel, Text, Stimme und Revision. Jeder tatsächliche Syntheseversuch erhält eine eigene Quotenreservierung; unklare Providerfehler erstatten keine möglicherweise verbrauchten Zeichen.

Der echte lokale Workerd-Test mit abgefangenen HTTP-Anfragen fand zunächst einen inkompatiblen Redirect-Modus. Der Adapter verwendet jetzt `manual` und lehnt 3xx ab, ohne den Azure-Schlüssel weiterzugeben. Probe bestanden: standardmäßig HTTP503, zwei abgefangene native Fetch-Aufrufe, Weiterleitung abgelehnt, null externe Netzwerkanfragen. Die zehn Mockbytes belegen keine MP3-Decodierung. Ergebnis in `workerd-result.json`; lokaler Reproduktionslauf `node work/cf-runtime/podcast-probe.mjs` mit bereits vorhandener Miniflare-Installation, keine neue Installation oder Anbieterabrechnung.

**Noch nicht produktiv verbunden:** Artikel-/Freigabeadapter, gemeinsame Quoten der alten und neuen App, privater R2-Speicher samt Löschung, konkrete Azure-Ressourcenbindung und Bedienoberfläche zur Podcast-Erstellung. Die alte Quotenimplementierung reserviert Zeichen und Speicher getrennt; sie erfüllt den neuen atomaren Port noch nicht. Deshalb bleibt der Worker ausdrücklich deaktiviert, auch wenn Umgebungsflags gesetzt werden. Die F0-Bestätigung allein ist kein Nachweis dieser Verbindungen. Reale Audioerzeugung, Wiedergabe, Veröffentlichung und vollständige Medienfreigabe sind weiterhin offen. MEDIA-03 bleibt in Arbeit; Zine und übrige RC-Anforderungen bleiben erhalten.

Abschluss: 18/18 Diensttests, Typprüfung und gezielter ESLint bestanden. Unabhängiger Abschlussreview PASS nach Korrektur der exakten Requestform: zusätzliche Text-/URL-Felder werden vor Resolver, Quota und Synthese abgewiesen. PASS gilt ausschließlich für die deaktivierte Migrationsgrundlage. Alle Implementierungsdateien und finalen Belege sind im gemeinsamen Hashmanifest erfasst.
