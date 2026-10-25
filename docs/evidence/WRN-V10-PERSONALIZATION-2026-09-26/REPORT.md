# V10-Personalisierung: Sportwahl und Browsernachlauf

Die lokale Auswahl „Sport“ lieferte für den aufgenommenen V8-Inhaltsstand keine Karten, obwohl vier Artikel im Discover-Index das redaktionelle Thema `sports` tragen. Der Produktvertrag speichert die Nutzerwahl als `sport`. Die Domain-Projektion und der tatsächlich verwendete Produktionsfilter erkennen jetzt genau dieses belegte Alias; kanonische Themen- und Regions-IDs des Index werden ebenfalls in der Domain-Projektion erkannt. Unbekannte Metadaten bleiben ohne Treffer. Es gibt keine neue Speicherung, Profilbildung oder externe Anfrage.

Der zuvor vollständige Browserlauf meldete 83 Fehler bei 2001 bestandenen und 1598 planmäßig übersprungenen Kombinationen. 63 Fehler gehörten zum alten Personalisierungstest, der weiterhin acht statt der inzwischen elf englischen Artikel erwartete. Der Test ist an das aufgenommene V8-Manifest gebunden und prüft nun elf englische sowie die vier exakten Sportartikel. Die Kombination Sport + Deutsch prüft weiterhin den leeren Trefferfall. Der Mehr-Tab-Fall wartet nach dem erneuten Inhalts-Guard höchstens 15 Sekunden auf die wiederhergestellten Karten; die Konflikt- und Speicherprüfung bleibt erhalten.

Prüfung dieses Pakets:

- Domain-Personalisierung: 5/5 gezielte Fälle PASS; Produktionsauswahl und Erklärungen im Mobile-Paket: 19/19 PASS.
- App-/Website-Personalisierung im Browser bei 390 × 844: 11/11 PASS, einschließlich Sporttreffern, Leserückkehr, Reload, neun UI-Sprachen, Schutz unbekannter Speicherwerte und Mehr-Tab-Konflikt.
- Gezielter Nachlauf der zuvor auffälligen Reader-, Home-, Medien-Erststart- und Quellenfälle mit zwei Workern im Projekt `website-800x1280`: 62/62 PASS.
- `pnpm check` vollständig PASS: Mobile 990/990, Website 155/155, zusätzliche Website-Node-Tests 71/71, Inhaltsbetrieb 81/81, Grenzen 25/25. `pnpm build` für App und Website einschließlich Chunk-Grenze PASS. `git diff --check` PASS.
- Unabhängiger, nur lesender Abschlussreview der fünf geänderten Produkt-/Testpfade: PASS ohne Findings. Er hat keine Tests selbst ausgeführt.

[Website-Sichtprobe](website-following-results.png) und [App-Sichtprobe](mobile-following-results.png) stammen aus dem erfolgreichen Browserlauf. Die App-Aufnahme zeigt einen späteren Scrollstand mit Header, Auswahl und Ergebnisbeginn; sie belegt keine vollständige visuelle Geräteabnahme. [SHA-256-Manifest](SHA256SUMS.txt) bindet Code und Bilder.

Das neue **unsignierte** Android-AAB wurde strikt offline aus Produktcommit `a4cbbff92b08219e28f4f84894fea3bcb1fa91b6` mit leerer Providerkonfiguration gebaut: Version 2.2.0/Code 27/Target 36, SHA-256 `e187e9f32d54ec198b25fb298ad29c9ec3ce2d607d12e1756723e7fc1a7faffc`. Gradle und `lintVitalRelease` PASS; der Receiptvergleich bestätigt 108/108 verpackte Assets. Eine getrennte Kopie wurde für die **Interne App-Freigabe** mit einem einmaligen lokalen Testschlüssel signiert:

`work/wrn-android-release-jIHM2Q/WorldRevolutionNews-2.2.0-code27-internal-sharing-a4cbbff.aab`, 9.711.762 Byte, SHA-256 `70830a948bd7b8cf3a0666c06f788ec5c881dcdc1b075c0db9c56883953931df`. JAR-Signatur und 108/108 Assets PASS; Bundletool bestätigt `com.world.revolution`, Code 27, Target 36. Der temporäre private Testschlüssel wurde entfernt. Diese AAB ist **nicht** mit dem Play-Upload-Schlüssel signiert und wurde nicht hochgeladen.

Der 62er Nachlauf ersetzt keine erneute vollständige 3682-Fälle-Matrix auf dem neuen Stand. Der bisher mit der PO-JKS signierte AAB stammt noch aus `4cfaafd` und enthält diese Korrektur nicht. Neue JKS-Signierung, exakter Android-Upgrade-Test dieses Kandidaten, Live-Host- und Widerrufsbindung, echte Providerproben, Play-interner Test und PO-Sichtabnahme bleiben offen. Zine, World Revolution Map und Action Radar bleiben geplante offene Erweiterungen; sie werden nicht als vorhandene Produktfunktionen ausgegeben. Kein Push, Play-Upload oder Live-Deployment erfolgte.
