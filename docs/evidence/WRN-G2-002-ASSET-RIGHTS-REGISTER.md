# WRN-G2-002 – Asset- und Rechte-Register

Stand: 23. August 2026
Methode: read-only Dateiinventar und SHA-256; es wurde keine Legacydatei kopiert.

## Ergebnis

Die Dateien sind technisch identifiziert, aber noch nicht automatisch zur
Uebernahme freigegeben. Weder App- noch Website-Repository enthaelt eine
repositoryweite `LICENSE`. Der `ISC`-Eintrag im untergeordneten
`android-wrapper/package.json` ersetzt keine Rechtekette fuer den gesamten
Quellcode, die Markenbilder, Inhalte oder Fonts.

| Klasse | Status fuer neues Repository | Entscheidung/Gate |
|---|---|---|
| `Qood.ttf` und alle Kopien | **BLOCKED** | beiliegender Hinweis erlaubt nur persoenliche, nicht kommerzielle Nutzung und verbietet Distribution/Produkteinbettung; ersetzen oder gueltige Lizenz samt Distributionsrecht belegen |
| WRN-/Solinaridao-Logos, Header, Masken und Hintergrund | **UNGEKLAERT – NICHT IMPORTIEREN** | Product Owner belegt eigene Urheberschaft/Rechtekette oder laesst das Asset neu und nachweisbar erstellen |
| Android-Icon-/Splash-Ableitungen | **UNGEKLAERT – NICHT IMPORTIEREN** | erst kanonisches, rechtegeklaertes Masterasset bestimmen; Ableitungen spaeter reproduzierbar generieren |
| `placeholder.jpg` | **AUSSCHLIESSEN** | Datei hat nur zwei Bytes und ist keine brauchbare Quelle |
| Legacy-Quellcode und Inhalte | **NICHT PAUSCHAL KOPIEREN** | Feature fuer Feature neu schreiben; nur konkret belegte eigene Bestandteile uebernehmen |
| externe Artikelbilder, Audio, Video und Quellen | **PRO ELEMENT PRUEFEN** | bevorzugt verlinken/provenienzbelegen; keine Kopie ohne passende Lizenz |

## Kanonische technische Fingerabdruecke

Die folgenden Dateien liegen in App und Website mit identischem SHA-256 vor.
Alle Rechte bleiben ungeprueft.

| Datei | Bytes | SHA-256 |
|---|---:|---|
| `icon.svg` | 492 | `08D3FEB89366F4039447B81F9E30B7885F38C035D2F764611F60AF1D3C5D035A` |
| `app-background.webp` | 81,416 | `CBA5EB9BBFB9E20D2DAD86EBC9295C5D48F04EE080087A42F7E6CA85ADEF1167` |
| `Qood.ttf` | 110,600 | `38C556EC47C10C481259820C876DB11707F4052AC9C9AFDF5FF73EC1142A8A2E` |
| `solinaridao-header-logo-light-transparent.png` | 1,249,449 | `CED97AD24AB9239E0509B8845776667CE9D9FC060852613CB0A37C4D60C101E0` |
| `solinaridao-header-logo-transparent.png` | 1,242,657 | `81AAF3E3B14DB4F467C637F10C2ABBDBB78E17D6E234CBDA5C7B6AE207F1ECB4` |
| `wrn-future-header-white.png` | 212,123 | `9DA0E22936304A30A55BA1483C2305C6AD6C3B1A057341AF2AB3B16FE98A5E2F` |
| `wrn-future-header.png` | 438,922 | `5901B56CDCD3F8E347C51E915B8CE4614D21F2746DF3313D2F7C69A1F3BCB448` |
| `wrn-future-header.webp` | 222,372 | `913B57AA4B598BC89B7F9D1A94261FA673655D169F60D0CBCEC1DF35D2623ECD` |
| `wrn-header-banner.webp` | 81,694 | `45F5344DA6F9DCAC7B1F882BF07837AF5C85C65A71ADFB4DD98BBA0022FC7416` |
| `wrn-logo-preview-transparent.png` | 523,375 | `EF40D81782531B08688DF370AAE42A4FA91A2034E0491F76CF21D6D6463AC2DD` |
| `wrn-logo.webp` | 143,139 | `A9BC7A6BFF64CFF64B1AE0073318A03AA7F589FC2CACAB9371B8791D53900270` |

## Abweichende und zusaetzliche Masterkandidaten

| Quelle/Datei | Bytes | SHA-256 | Bewertung |
|---|---:|---|---|
| App `solinaridao-header-logo.png` | 1,659,169 | `814C83B6DD027ABECECDDA0B4C7F4878B3A6E5BDCBFD8B649312582AC122152B` | unterscheidet sich von Website; Variante klaeren |
| Website `solinaridao-header-logo.png` | 78,854 | `C599F1F9B397780288D36D4849E049C56412D6C5C75E14B84A6C79BBA452F142` | unterscheidet sich von App; Variante klaeren |
| App `solinaridao-header-mark-filled.png` | 1,197,127 | `60F839B54A573173D28387DBB2DC6199B2474FC4EF6450FF4EF933108C141081` | Rechte ungeklärt |
| App `solinaridao-world-revolution-news-mask.png` | 35,938 | `18C4E5A504CFAA0AAC882B68118B7D81DD2B91B3BB9AB3265D54D5480907D411` | Rechte ungeklärt |
| Website `wrn-word-world.png` | 63,407 | `7F999810AD296541FA439A4F3EFC3674DAE94AC7CF7E7D6D19278671830D693C` | Rechte ungeklärt |
| Website `wrn-word-revolution.png` | 92,574 | `905DF58AC164DE66FDB2AA984AEEACE97260C28F849D71A16D426666F874FA2F` | Rechte ungeklärt |
| Website `wrn-word-news.png` | 55,173 | `92AFD78826115C2E0A44B8A29F970029C107B61EFDDB63ABBFE04CE37EB63680` | Rechte ungeklärt |
| App `android-wrapper/assets/icon.png` | 1,908,440 | `C5AA6139881658F5943AAF3FD646508232F575345D984444BAEB32B8674B582E` | identisch zu `splash.png`; Masterrolle unklar |
| App `android-wrapper/assets/splash.png` | 1,908,440 | `C5AA6139881658F5943AAF3FD646508232F575345D984444BAEB32B8674B582E` | identisch zu `icon.png`; Masterrolle unklar |

Weitere Android- und Website-Icon-/Splashgroessen werden als generierte
Ableitungen behandelt und nicht einzeln als manuell gepflegte Masterquelle
importiert.

## Herkunftsbelege

- Appquelle: `wrn-github-app-current@2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Websitequelle: `wrn-web-portal-2026-08-20-r10n-work@9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Qood-Hinweis: `android-wrapper/font/qood/text.txt`, SHA-256
  `B9A9E7CFEB8202757A05CA3BF07859967B2D75F2D6F0C165DF8EC1AACCA3833C`
- App-README und Website-README verneinen eine pauschale Open-Source-Lizenz.

## Einfachste sichere Product-Owner-Entscheidung

Empfehlung: `Qood.ttf` nicht lizenzieren und durch eine passende Open-Source-
Schrift mit nachweisbarer OFL-/Apache-Lizenz ersetzen. Fuer die Markenassets
genuegt als naechster Schritt eine schriftliche Eigentuemererklaerung des
Product Owners nur dann, wenn er sie selbst erstellt hat oder die vollstaendige
Rechtekette kennt; andernfalls werden sie neu erstellt.
