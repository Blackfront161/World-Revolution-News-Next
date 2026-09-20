# Gemini-Kontingente – read-only, 20. September 2026

Das verbundene Google AI Studio zeigt beim bestehenden Projekt Anarchy-News ausdrücklich „Kostenlose Stufe“. Kein Billing wurde aktiviert, kein Schlüssel geöffnet und keine Modellanfrage gesendet.

| Im Dashboard sichtbares Modell | Anfragen/Minute | Eingabetokens/Minute | Anfragen/Tag |
| --- | ---: | ---: | ---: |
| Gemini 2.5 Flash | 5 | 250000 | 20 |
| Gemini 3.5 Flash | 5 | 250000 | 20 |
| Gemini 3.1 Flash Lite | 15 | 250000 | 500 |

Dies sind beobachtete Projektgrenzen, keine dauerhafte Leistungsgarantie. Die Ansicht zeigt Spitzenwerte der letzten28 Tage, nicht ein verbleibendes Tagesguthaben. Sie enthält bereits Überschreitungen und einen Rate-Limit-Hinweis. Die alte Cloudflare-Konfiguration TRANSLATION_DAILY_LIMIT=950 ist deshalb kein Beleg für950 zulässige Gemini-Aufrufe. Die Zuordnung der maskierten Cloudflare-Schlüssel zu diesem Projekt ist weiterhin nicht nachgewiesen; sie wird nicht geraten.

Google dokumentiert projektweite statt schlüsselweite Grenzen sowie Tagesreset um Mitternacht Pacific Time: https://ai.google.dev/gemini-api/docs/rate-limits . Mehr Schlüssel desselben Projekts sind kein zusätzliches Kontingent. Bestehende Live-Aufrufe und ein neuer Dienst würden bei gemeinsamer Projektbindung dasselbe Kontingent teilen.

Das stabile Modell gemini-3.1-flash-lite wird von Google ausdrücklich auch für Übersetzungen beschrieben: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite . Es ist ein Kandidat für eine spätere qualitätsgeprüfte, explizite Konfiguration, keine bereits vorgenommene Modellumstellung. Gemischte/komplexe politische Artikel müssen im Sprachvergleich überprüft werden. Keine automatische Auswahl von „latest“, keine Quoten-Umgehung und kein bezahlter Fallback.

Vor Aktivierung bleiben nötig: verbindliche Zuordnung zu einem kostenlosen Projekt, dessen übrige Nutzung und Restbudget, Secretstorebindung, native Cache-/Quotenressourcen, Ziel-Origin und Runtime-Test. Das Abschalten bei fehlender Konfiguration ist beabsichtigt.
## Altcode und Hugging Face

Der erfasste Legacy-Proxy3349d475 enthält bereits Gemini3.5Flash,3.1FlashLite,2.5FlashLite und2.5Flash. Fehlende neue Modellnamen sind hier also nicht der belegte Hauptfehler. Er probiert jedoch mehrere Modelle pro Schlüssel und anschließend Hugging Face, was zusätzliche Versuche und längere Antwortzeiten erzeugen kann. Der Neubau behält explizite Modellwahl, einen Versuch und Cache vor Provider bei.

Hugging Face Billing read-only am20.09.: Credits0,00USD, aktuelle Inference-Nutzung0,00 von0,10USD, keine ausgewiesene automatische Aufladung. Das belegt ein kleines Kontingent, keine unbegrenzte Gratisübersetzung. Der Legacy-Proxy nutzt router.huggingface.co mit Qwen/Qwen2.5-7B-Instruct-1M:fastest beziehungsweise google/gemma-2-2b-it:fastest. Im Neubau bleibt dieser nicht als automatisch kostenfreier Fallback eingebunden. Keine Schlüsselwerte, Zahlungseinstellungen oder Provideraufrufe wurden geöffnet/verändert.

Nachtrag: native KV-/SQLite-Portadapter und lokaler Workerd-Test inzwischen bestanden; siehe NATIVE-TRANSLATION.md. Tatsächliche Ressourcenbindung und kostenloses Providerprojekt bleiben offen.
