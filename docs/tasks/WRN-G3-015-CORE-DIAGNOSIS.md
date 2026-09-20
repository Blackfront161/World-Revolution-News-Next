# WRN-G3-015 – enger Core-/Adapter-Incidentabgleich

28. August 2026. Innerhalb PO-074, kein neuer Produktscope.
Ausgang P2-YELLOW `115d8a7`/`38f5375`; Start nach gesichertem S2-Handoff/Ende.
Chief reserviert genau einen frischen `incident_debugger` Sol/high,
keine Kinder. Produkt/Bestandstests/Governance read-only; eigene Probe-
und Berichtdateien nur `docs/evidence/WRN-G3-015/diagnosis/**` und Handoff
`docs/handoffs/WRN-G3-015-core-diagnosis.md`. Keine Selbstkorrektur.

## Anlass und konkrete Fragen

Chief sah im Zwischenstand zwei direkte Vertragswidersprueche:

1. Worker-install ersetzt fehlenden Controlrecord durch enabled:true; damit
   gilt die benoetigte dauerhafte Enable-/Remove-Epochbarriere nicht durchgaengig.
2. Worker-fetch verlangt globale control.ready==eigene shellId. Install B
   ueberschreibt ready, waehrend A noch kontrolliert; A koennte dadurch ausfallen.

Vier direkt registrierende Builtproben beweisen keine vollstaendige
Defaultadapter-/Remove-/Mehrtabintegration. Browserplattform und Adapter sind
ausdruecklich unfertig. Das ist kein Context-Rot-Urteil, keine Markerrotation.

Lies Elternvertrag B1–B4, BACKEND-PACKET, beide PRECHECKs, S2-Handoff und
aktuellen eng betroffenen Code. Belege zuerst die zwei genannten Ablaeufe
auf unveraendertem Kandidaten mit echten Browser-/Cacheproben in isoliertem
Profil; rohe Reports aufbewahren. Kein bloss hypothetisches Produktfinding.
Fuer Proben noetige synthetische A/B-Pakete duerfen nur unter eigener Evidence
oder frischem kurzem Temp-Pfad liegen; Defaultsource nicht instrumentieren.

Dann eng abgleichen: Welche Control-/Generations-/Ticketstruktur fehlt, damit
Install/Waiting/Active/Rollback/Remove/Restart wirklich B1–B4 erfuellen?
Ist die vorhandene Struktur fachlich vervollstaendigbar oder braucht es eine
kohaerente interne Neuordnung im bereits freigegebenen offline-shell-Pfad?
Konkreten minimalen Reparaturplan und rote Restmatrix liefern, keine neue ADR.
Insbesondere eigene Workeridentitaet pro Generation, unbekannt/missing/
malformed unterscheiden, geteilte strikt validierte Controlstruktur statt
verschiedener Window-/Workerannahmen, bounded Jobtickets/Quieszenz, Ready vor
Activate und kein read-open-Nachfuellen nach Remove. Reine Sourcebefunde und
echte Reproduktionen getrennt kennzeichnen. Kein allgemeiner Vollreporeview.

Vorhandener Generator/AST-/Buildgraph ist Kontext, nicht erneut voll auditieren.
UI/Sprachen/Brand/Mobile/G3-014 bleiben unangetastet. Keine neuen Dependencies,
Live/Legacy, APIkosten, Android, Cloud/Remote/CI oder Release. Keine PO-Origins
43113/43114 oder Userprofile. Vorhandene exakte Toolchain, kurze isolierte
Chromeprofile, keine Loeschung von Evidence/Tempverzeichnissen. Du bist nicht
allein: Chief pflegt Governance; fremde Aenderungen erhalten.

Aufwandsgrenze: eine fokussierte Diagnose-/Reproduktionsrunde, grob 20 Minuten
Checkpoint; bei Umweltblocker konkreten Ersatzbeleg/Rest nennen. Handoff mit
Quelle/Hashes, Rohreports, zwei Dispositionen und klarer P2-Fortsetzungsgrenze.
Eigene Evidence/Handoff exakt lokal committen, kein Amend; danach Ende.

END-CHECK: :)
