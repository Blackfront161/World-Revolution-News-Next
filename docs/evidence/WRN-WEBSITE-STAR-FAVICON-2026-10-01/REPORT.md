# Originale Windrose als Website-Favicon

Die vorherige Favicon-Zuordnung verwendete das SOLINARIDAO-Kopflogo mit Schrift. Gewünscht ist das vorhandene rot-schwarze facettierte Stern-/Windrosensymbol mit News-Banderole. Das Kopf- und Headerlogo wird nicht geändert.

Der Website-Asset `apps/website/src/assets/wrn-app-icon.png` ist eine exakte Kopie des vorhandenen nativen Icons aus `wrn-github-app-current`, Commit `260fed388385cbc8ef203a2f534d97d694d92e54`, Pfad `android-wrapper/android/app/src/main/res/mipmap-hdpi/ic_launcher.png`. Maße 72 × 72, 8.845 Bytes, SHA256 `78b3dbd6c6de3876c6a15012dd0ea683136ace682382f50036d68d2250d2314f`. Beide Dateien sind bytegleich; keine neue Zeichnung, Konvertierung oder Generierung. App-/Androiddateien wurden ausschließlich gelesen.

Die vorhandene Shell mit 14 Dateien umfasst 8.365.885 Bytes bei unveränderter Grenze von 8.388.608. Der 1.908.440-Byte-Master passt nicht zusätzlich hinein. Die kleine native PNG-Version passt: aktueller Build mit 15 Dateien 8.373.774 Bytes vor der vorhandenen Veröffentlichungseinbettung. Das finale Paket muss seine tatsächliche Summe erneut bestätigen.

Die beiden bisherigen PNG-Headerfamilien bleiben zwingend. Die neue eigene Familie `wrn-app-icon-<hash>.png` ist zusätzlich optional und auf 16 KiB, exaktes PNG-MIME und einen Eintrag begrenzt. Der Builder nimmt sie ausschließlich auf, wenn das HTML-Favicon genau diese Datei referenziert. Frühere Graphen ohne dieses Icon bleiben gültig für Rückwechsel; alte fünfteilige Generationen bleiben unverändert. Fremde, fehlende, doppelte, unreferenzierte oder zu große Iconressourcen werden abgewiesen. SHA, MIME, Streaming-/Gesamtbudgets, Widerrufe und die Kompressionskorrektur bleiben erhalten.

Fokussiert geprüft: 35 Builder-/Protokolltests PASS, darunter echtes Original-SHA, unveränderte Header-/Metadatenbytes, historische Graphen sowie neue Negativfälle. Produktionsbuild, fokussiertes ESLint und vier echte Chrome-Favicon-/Offline-Neustarttests in Mobil, Tablet, Desktop und Reflow PASS. Diese Browsertests dekodieren die Windrose offline als 72 × 72 mit identischer Bytezahl und SHA; der Header verweist weiterhin auf das bisherige Kopfasset.

Dieser Stand ist lokal, noch nicht veröffentlicht. Inhaltssnapshot, Source-Pässe, Produktions- und Widerrufstände bleiben gebunden. Paketprüfung, unabhängige Abnahme und Live-/Offline-Abschluss stehen für das neue konkrete READY noch aus. Eine mögliche andere betroffene Oberfläche wird durch den Head Chief separat geklärt.
