# WRN-G2-002 – Stack- und Lizenzbeleg vor G3

Stand: 23. August 2026
Zweck: Architekturentscheidung bestaetigen, ohne Abhaengigkeiten zu installieren.

## Bestaetigte Richtung

| Baustein | Offizieller/Legacy-Beleg | Lizenz | G3-Regel |
|---|---|---|---|
| React | offizielle Versionsseite nennt React 19.2 als aktuelle Linie | MIT | exakte kompatible Patchversion erst im freigegebenen Foundation-Task sperren |
| TypeScript | offizielles Microsoft-Repository | Apache-2.0 | exakte stabile Version zusammen mit Vite-/Plugin-Kompatibilitaet sperren |
| Vite | offizielle Release-Seite nennt `vite@8.2` als regulaer unterstuetzte Linie | MIT | Minor-/Patchwechsel nie unbemerkt; Lockfile und zwei reproduzierbare Builds |
| Capacitor | offizielle Dokumentation steht auf v8; Legacy nutzt 8.4.0 | MIT | v8-Richtung bestaetigt; exakte Core/CLI/Android-Version gemeinsam sperren |
| Cloudflare Workers/Wrangler | lokales Worker-Paket nennt Wrangler 4.114.0; offizielle Config-Doku fordert getestete Compatibility-Dates und behandelt Config als Quelle der Wahrheit | Komponentenabhaengig | exakte Version und Drittanbieter-Lizenzscan im jeweiligen Service-Task |

Offizielle Referenzen:

- <https://react.dev/versions>
- <https://github.com/facebook/react/blob/main/LICENSE>
- <https://vite.dev/releases>
- <https://github.com/vitejs/vite/blob/main/LICENSE>
- <https://capacitorjs.com/docs>
- <https://github.com/ionic-team/capacitor/blob/main/LICENSE>
- <https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt>
- <https://developers.cloudflare.com/workers/wrangler/configuration/>

## Warum noch keine exakten neuen Patchversionen eingetragen werden

Vor `GO-IMPLEMENTATION` werden keine Pakete aufgeloest oder installiert. Eine
heute notierte Patchkombination ohne echte Peer-Dependency-, Build- und
Androidpruefung waere Scheingenauigkeit. Der erste freigegebene Foundation-
Task muss deshalb in einer einzigen kleinen Aenderung:

1. die aktuellen stabilen, gegenseitig kompatiblen Versionen aufloesen,
2. Lizenz- und Herkunftsbericht erzeugen,
3. Lockfile einchecken,
4. Mobile und Website getrennt bauen und testen,
5. Versionsentscheid und Rollback im Handoff festhalten.

## Lizenzgrenze

Die Frameworklizenzen erlauben grundsaetzlich die geplante technische Nutzung.
Das erteilt keinerlei Recht an Legacycode, Markenassets, Fonts, redaktionellen
Inhalten oder Medien. Vor jedem Release werden SBOM/Dependency-License-Report,
Third-Party-Notices und das Asset-/Rechteregister gemeinsam geprueft.
