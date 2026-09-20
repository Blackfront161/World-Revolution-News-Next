# WRN-G3-014 P2-S – begrenzter Speicherabschluss

Eltern: PO-071, G3-014-Taskvertrag und WORK-PACKETS. Nur nach beendetem und
gesichertem P2-L, Chief reserviert genau einen Backend/Data-Agenten. Kein
neuer Produktscope. Die folgenden Codebeobachtungen auf `2bf3aee` sind
Pruefansatzpunkte, keine bereits ausgefuehrten roten Testnachweise.

## Besitz und Ergebnis

Eigentum: beide `apps/*/src/content-offline-store.ts`, ausschliesslich eng
benannte lokale Speicherhelfer, `tests/e2e/content-offline-store.spec.ts` und
eng benannte externe Storage-/Raceharnesses. Testfixtureerweiterungen erst
nach P2-L-Handoff. Keine UI, Rootconfig, Dependencies, public-Releases,
Publisher oder alten Projekte. Additive Vertragserweiterung nur nach
expliziter Rueckfrage an Chief; vorhandene P2-L-Validatoren verwenden.

Ziel: verlassliche primitive Speicher-API fuer den anschliessenden P2-C-
Controller, nicht eine zweite Orchestrierung im Frontend. Fuer jede Korrektur
zuerst deterministische rote Probe, danach gruener echter Browser-IDB-Beleg
je Client. Keine IDB-Emulationsinstallation.

## S1 – gesamte Operation und spaete Ereignisse

- Signal vor Oeffnen/Transaktion pruefen. Timeout/Abort/Complete-Handler ab
  Transaktionsbeginn, nicht erst nach dem letzten erfolgreichen Request.
- Alle Ausgaenge raeumen Listener/Timer auf. Schreibfehler oder Abbruch
  muessen die Transaktion abbrechen; Request-success allein ist kein Erfolg.
- `close`/Versionwechsel lassen keine neue Operation beginnen; abgebrochene
  oder verspätete Open-Ergebnisse schliessen sich selbst. Ein nach bereits
  abgewickeltem Timeout/Abort eintreffendes Upgrade darf kein Schema anlegen.
- Kontrollierbare Barrieren vor/nach put und vor Abschluss statt Schlafen.

## S2 – unbekannte oder teilweise verlorene Daten

- v2, falsche Stores/Keypaths, malformed Control/Bundle, ungebundene Zeiger
  und fehlendes Control neben vorhandenen Bundles bleiben unangetastet.
- Niemals stiller Reset oder Downgrade. `blocked`/Versionwechsel getrennt
  ausweisen. Frisches leeres v1-Schema ist nur der gebundene Erststartfall.
- Fremde Datenbank, anderer Client und lokale Praeferenz-/Lesekeys mit
  Sentinelwerten belegen; keine Loeschung eines persoenlichen Browserprofils.

## S3 – Kandidaten, Zeiger, Zeit und Budgets

- A speichern/aktivieren, B fertig pruefen/stagen und den passenden Pending-
  Abgleich abschliessen: A bleibt nutzbar, B laesst sich spaeter bewusst
  aktivieren. Der aktuelle Code verweigert Aktivierung mit aktivem A, sobald
  Pending bereits abgeschlossen ist; dies darf den normalen Nutzerfluss
  nicht unmoeglich machen. Zusaetzliche Quellenarbeit ist kein Ersatz.
- Wiederholtes A, bereits vorhandener vorheriger Stand und B ersetzen keine
  Zeiger durch Duplikate. Gleiche Release-ID/andere Bytes bleibt Konflikt.
- Neue Bundlebytes muessen in der Summenberechnung enthalten sein; alle
  Pointer/Stores hoechstens drei gueltige Bundles und gebundene Bytes.
- 24h-Frist bleibt an den tatsaechlich vollstaendig geprueften Bundleinhalt
  gebunden: ein neuer B-Check verjuengt A nicht; Rollback uebertraegt nicht
  B-Pruefzeit auf A. Rueckwaertsuhr/abgelaufener Kandidat sicher behandeln.

## S4 – Safety, Pending und konkurrierende Tabs

- Vor Quellenarbeit vorbereiteter Pendingmarker, generation-/clearEpoch-
  gebundener Abschluss, kein fremdes/alt gewordenes Abschliessen. Nach Crash
  muss ein neuer expliziter Check sicher moeglich sein, kein ewiger Deadlock.
- Sicherheitsabgleich und vollstaendiger Contentcheck getrennt halten: Nur
  ein tatsaechlich verifizierter passender Safetybeleg mit abgeschlossenem
  Ledgercommit kann die Pendingpflicht erledigen, nie ein nackter Fehler- oder
  Finallypfad. Scheitert nur unabhaengiger Content, darf dieser Safetyabschluss
  weder eine erfolgreiche Inhaltspruefung behaupten noch As Lesefrist
  verlaengern. Fehlt der Safetybeleg oder misslingt sein Commit, bleibt Pending.
- Ledgeraufnahme entfernt ALLE nach P2-L unzulaessigen Bundles/Zeiger, auch
  unterhalb des Floors ohne direkt enthaltene gesperrte Artikel-ID. Gehashte
  Altdokumente nicht reparieren. Asynchrones Hashing ausserhalb der IDB-
  Schreibtransaktion; Sicherheitsstand/Identitaet/Generation darin vergleichen.
- Clear erhaelt Ledger und ausstehende Sicherheitspruefung, inkrementiert
  Epoch und verhindert spaetes Wiederbefuellen. Zwei echte Tabs an einer
  kontrollierten Commitbarriere: nur eine aktuelle Generation darf gewinnen.
- Aktiven Inhalt als konsistente Einheit lesen und nach asynchroner Pruefung
  neueren Controlstand erkennen. P2-C muss daraus Reader/Resume guards bauen
  koennen, ohne selbst ungeschuetzte DB-Zugriffe zu erfinden.

## S5 – ehrliche Fehlerbelege und Uebergabe

- Quota-/Safetywritefehler im echten IDB-Pfad belegen; injizierte
  Plattformfehler explizit als injiziert beschreiben, nicht als vollgeschriebene
  Festplatte. Nach Prozessende/Neuoeffnen bleibt Pending nachweisbar gesperrt.
- Prozessende separat von blossem Reload benennen. Ein frisches isoliertes
  persistentes Testprofil ist erlaubt; bestehende Nutzerprofile nie verwenden.
- OFF-IDs dispositionsgenau abbilden: atomare Storesemantik hier, UI-Dialoge
  erst P3/P4. Keine pauschale OFF-Gesamtfreigabe aus einem einzelnen Storetest.
- Handoff nennt exakte API, Fehler-/Zeit-/Cancelgarantien und offene P2-C-
  Pflichten. Tests/Belege in `docs/evidence/WRN-G3-014/STORAGE-COMPLETION.md`,
  Handoff `docs/handoffs/WRN-G3-014-storage-completion.md`.

Aufwandsgrenze: hoechstens zwei erfolglose Korrekturen desselben roten Falls,
dann Diagnose an Chief. Kein Weiterdelegieren. Nur gesicherte fachliche
Teilabschluesse; P2 insgesamt bleibt bis Controller/Abgleich YELLOW.

END-CHECK: :)
