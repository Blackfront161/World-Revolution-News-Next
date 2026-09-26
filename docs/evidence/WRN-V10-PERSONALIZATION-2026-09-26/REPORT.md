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

Der 62er Nachlauf ersetzt keine erneute vollständige 3682-Fälle-Matrix auf dem neuen Stand. Der bisher JKS-signierte AAB stammt noch aus `4cfaafd` und enthält diese Korrektur nicht. Exakte neue Android-Signierung/Upgrade-Prüfung, Live-Host- und Widerrufsbindung, echte Providerproben, Play-interner Test und PO-Sichtabnahme bleiben offen. Zine, World Revolution Map und Action Radar bleiben geplante offene Erweiterungen; sie werden nicht als vorhandene Produktfunktionen ausgegeben. Kein Push, Play-Upload oder Live-Deployment erfolgte.
