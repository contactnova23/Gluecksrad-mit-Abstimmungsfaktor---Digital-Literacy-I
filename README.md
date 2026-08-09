# Glücksrad mit Abstimmungsfaktor – Glückshafen Basel

Web-App-Prototyp für die Prüfungsleistung in Digital Literacy I. Die Anwendung verbindet eine Abstimmung mit einem gewichteten Glücksrad und inszeniert den Ablauf als historisch inspirierten Glückshafen auf einem spätmittelalterlichen Basler Markt- und Festplatz.

GitHub-Pages-Adresse des Projekts (entspricht diesem Repository-Stand erst nach dessen Veröffentlichung):
https://contactnova23.github.io/Gluecksrad-mit-Abstimmungsfaktor---Digital-Literacy-I/

## Aktueller Funktionsstand

Die App besteht aus sechs aufeinanderfolgenden Etappen:

1. **Willkommen** – höfischer Aufruf zum Glückshafen mit dekorativem Holzrad.
2. **Auswahl** – neue Abstimmung eröffnen oder einem Online-Raum beitreten.
3. **Frage und Antworten** – Frage formulieren und mindestens zwei unterschiedliche Antwortoptionen anlegen.
4. **Abstimmungsort** – Raum-Modus oder Online-Modus wählen.
5. **Stimmabgabe** – Stimmen werden bis zum Schließen der Runde verborgen gehalten.
6. **Rad des Glücks** – Stimmenverteilung anzeigen, Rad starten, manuell anhalten und die Gewinnerproklamation anzeigen.

Eine Fortschrittsanzeige mit sechs Etappen begleitet diesen Ablauf. Kleine visuelle und akustische Rückmeldungen markieren unter anderem Etappenwechsel, hinzugefügte Antworten, Moduswahl, Stimmabgabe, Radstart und Gewinnerverkündung.

## Entscheidungslogik des Glücksrads

Die abgegebenen Stimmen bestimmen die Größe der Felder auf dem Rad:

- Eine Antwort mit mehr Stimmen erhält einen größeren Winkelanteil.
- Ein größeres Feld besitzt entsprechend eine höhere Gewinnchance.
- Die meistgewählte Antwort gewinnt **nicht automatisch**.
- Beim Betätigen von **„Rad anhalten“** wird die Gewinneroption zufallsbasiert entsprechend der Stimmengewichtung gezogen. Das Timing des Klicks selbst bestimmt die Gewinneroption nicht.
- Anschließend läuft die sichtbare Radanimation kontrolliert aus und landet auf dem Mittelpunkt des gezogenen Feldes.
- Wenn noch keine Stimme abgegeben wurde, sind alle Felder gleich groß und alle Antworten haben dieselbe Chance.

Die Ergebnisliste und das Rad benutzen dieselbe Farbzuordnung. Jede Antwortzeile erhält den Farbton ihres Radsegments sowie einen Farbindikator. Die ersten acht Farben sind fest definiert; bei mehr Antwortoptionen werden zusätzliche Farben deterministisch erzeugt, damit die Zuordnung nicht einfach zyklisch wiederholt wird.

Die Gewinnerproklamation erklärt die Logik bewusst in verständlicher Sprache:

> Eure Stimmen bestimmten, wie viel Raum jede Antwort auf dem Rad erhielt. Welches Feld schließlich zum Stehen kam, entschied der Zufall.

## Abstimmungsmodi

### Raum-Modus

Der Raum-Modus ist für eine Gruppe an einem gemeinsamen Gerät gedacht. Die Teilnehmenden geben nacheinander ihre Stimme ab. Die ausrufende Person schließt die Abstimmung und gelangt anschließend zum Rad des Glücks.

### Online-Modus

Der Online-Modus ist optional und benötigt ein vorhandenes Supabase-Projekt.

Beim Eröffnen einer Online-Runde:

- erstellt die ausrufende Person einen sechsstelligen Raumcode,
- wird die Abstimmung in der Tabelle `polls` gespeichert,
- können Teilnehmende mit dem Raumcode über eigene Geräte beitreten,
- wird pro Browser/Gerät eine bereits abgegebene Stimme zusätzlich über `localStorage` erkannt,
- aktualisiert die Moderationsansicht den Stimmenstand während der Abstimmung ungefähr alle drei Sekunden,
- kann nur die ausrufende Person die Online-Abstimmung schließen und das Rad bedienen.

Die App erwartet im Supabase-Projekt mindestens folgende Datenstruktur:

- `polls`: `id`, `question`, `options`, `room_code`, `is_closed`
- `votes`: `poll_id`, `option`, `voter_name`, `browser_key`

Die konkrete Datenbankdefinition, Constraints und Row-Level-Security-Regeln werden **nicht** von diesem Repository eingerichtet. Sie müssen im verwendeten Supabase-Projekt bereits passend konfiguriert sein.

### Supabase-Konfiguration

`config.js` enthält im gelieferten Repository bewusst Platzhalter. Für einen funktionierenden Online-Modus müssen dort die Project URL und ein öffentlicher Publishable-/Anon-Key des eigenen Supabase-Projekts eingetragen werden.

Ein `service_role`- oder anderer Secret-Key darf nicht in einer öffentlich ausgelieferten GitHub-Pages-Datei stehen.

Ohne gültige Supabase-Konfiguration bleibt der Raum-Modus nutzbar; beim Versuch, den Online-Modus zu verwenden, zeigt die App eine entsprechende Fehlermeldung.

## Gestaltung und Typografie

Die Oberfläche folgt einem einheitlichen, leichten Basel-Designsystem. Die Farbwelt orientiert sich an Rhein, Himmel, hellem Stein, begrünten Ufern und dem warmen Sandstein des Basler Münsters, ohne die Oberfläche schwer oder historisierend dunkel wirken zu lassen. Mittelalterliche Atmosphäre entsteht vor allem durch Proportion, Pergamentanmutung, feine Linien und die typografische Hierarchie.

- helle, warme Pergament-/Briefflächen mit sehr zurückhaltender Papierstruktur,
- Rheinblau bzw. gedämpftes Blaugrün als primärer UI-Akzent,
- kühles Schiefergrün für Text und Orientierung,
- gedämpftes Sandsteinrot und Messinggold nur als sparsame Akzente,
- `Cormorant Garamond` ausschließlich für Überschriften, Auswahlkartentitel und zeremonielle Titel,
- `Alegreya` für Fließtext, Formulare, Statusmeldungen und sämtliche UI-Buttons,
- `Parisienne` ausschließlich für die persönliche Unterschrift „Olga Nova“,
- eine durchgehende Button-Komponente mit heller Rhein-Färbung und dunkler Schrift; Hierarchie entsteht über Größe und Position statt über wechselnde Farben oder Schriftarten,
- konsistente Abstände, Feldhöhen, Radien und Textgrößen über alle sechs Etappen hinweg,
- eine reduzierte Fortschrittsanzeige und eine Gewinnerproklamation im selben visuellen System wie die Hauptfenster.

Die Fonts werden zur Laufzeit über Google Fonts geladen. Für Alegreya werden reguläre und kursive Schnitte sowie die im UI verwendeten Gewichte geladen; es werden keine Fontdateien im Repository mitgeliefert.

### Schutz der Glücksrad-Konstruktion

Die visuelle Überarbeitung verändert nicht die Architektur des Glücksrads. DOM-Aufbau, Radgestell, Radgeometrie, Segmentberechnung, Rotationslogik, Stop-Berechnung und das 3D-Glücksrad bleiben funktional unverändert. Das Designsystem formatiert lediglich die umgebenden Oberflächen wie Überschriften, Ergebnislegende und Bedienknöpfe.

## Glücksrad und Gewinnerverkündung

Die App enthält drei klar getrennte Rad-Darstellungen:

1. **Dekoratives Rad auf der Startseite** – rein visuell und ohne Einfluss auf die Auswahl.
2. **Funktionales UI-Rad im Ergebnisfenster** – stellt die tatsächlichen Stimmenanteile dar und führt die gewichtete Auswahl aus.
3. **3D-Holzrad in der Marktszene** – atmosphärische Begleitdarstellung; seine Bewegung wird an Radstart, Radstopp und Gewinnerereignis gekoppelt.

Das funktionale UI-Rad steht sichtbar auf einem langen Holzgestell. Die Gewinnerverkündung erscheint anschließend als Pergament-Proklamation im selben Designsystem wie die übrige App. Sie ist bewusst keine Rekonstruktion eines dokumentierten historischen Einzelrituals.

## Historisch inspirierte 3D-Szene

Die Three.js-Szene zeigt eine bewusst stilisierte, spätmittelalterlich inspirierte Basler Markt- und Festumgebung, unter anderem mit:

- Marktständen und Waren,
- Pflaster und Marktfläche,
- Brunnen,
- Bannern und Wimpeln,
- Schieß-/Geschicklichkeitsmotiven,
- Publikum,
- Glückshafen-Stand mit Gefäß und ausgestellten Gaben,
- hölzernem Glücksrad mit langem Gestell,
- kleinem Ausruf-/Gewinnerpodest,
- Stadtmauer und Toranlage,
- kirchlicher Stadtsilhouette.

Das digitale Rad ist eine moderne Visualisierung der gewichteten Auswahl und kein Anspruch darauf, dass ein solches Rad 1471 beim Basler Glückshafen eingesetzt wurde. Die historische Einordnung ist in `HISTORISCHE-GRUNDLAGE.md` dokumentiert.

## Klangkulisse

Die Klangkulisse wird vollständig mit der Web Audio API erzeugt. Es werden keine Audioaufnahmen geladen.

Enthalten sind unter anderem:

- Wind- und Stoffrauschen,
- abstrahiertes Marktgemurmel,
- Holzklappern,
- Glocken-/Klangsignale,
- dezente Ruf- und Vogelklänge,
- eigene Feedbacksignale für Stimmabgabe und Radphase.

Browser erlauben Audio normalerweise erst nach einer Nutzerinteraktion; deshalb wird die Klangkulisse beim ersten geeigneten Klick oder Tastendruck freigeschaltet. Der Sound-Schalter oben rechts speichert die Auswahl lokal. Bei einem inaktiven Browser-Tab wird die Audioverarbeitung angehalten beziehungsweise abgesenkt.

## Performance und Fallbacks

Die 3D-Darstellung wählt abhängig von Gerät, Speicherausstattung, Prozessorkernen, Data-Saver und `prefers-reduced-motion` eine Qualitätsstufe.

Dabei werden unter anderem angepasst:

- Ziel-Bildrate,
- maximale Pixel-Dichte,
- Antialiasing,
- Schatten,
- zusätzliche Wolken-/Szenendetails.

Die 3D-Szene verwendet getrennte Szenengruppen für Ankunft, Versammlung und Ergebnisbereich und blendet nur die jeweils relevanten Gruppen ein. Auf höherer Qualität verwendete Schatten werden nicht permanent neu berechnet. Wenn Three.js/WebGL nicht geladen werden kann, wird die 3D-Leinwand ausgeblendet; die eigentliche Abstimmungs-App bleibt bedienbar.

3D-Animation und Audio reagieren außerdem auf `visibilitychange`, damit bei einem inaktiven Tab weniger Arbeit anfällt.

## Lokale Speicherung

Die App verwendet `localStorage` für:

- den aktuellen lokalen App-/Abstimmungszustand,
- den Ein/Aus-Zustand der Klangkulisse,
- die Kennzeichnung einer bereits auf diesem Gerät abgegebenen Online-Stimme.

Diese Speicherung ersetzt keine serverseitige Zugriffskontrolle im Online-Modus.

## Urheberrecht und externe Abhängigkeiten

Die Marktszene, das Pflaster, die UI-Oberflächen und die Klangkulisse werden durch HTML/CSS/JavaScript beziehungsweise prozedural zur Laufzeit erzeugt. Das aktuelle Repository benötigt keine externen Foto-, Musik-, Geräusch-, 3D-Modell- oder Texturdateien.

Externe Laufzeitabhängigkeiten sind:

- Three.js über jsDelivr,
- Supabase JavaScript Client über jsDelivr,
- Google Fonts für Alegreya, Cormorant Garamond und Parisienne.

Details stehen in `ASSET-NACHWEISE.md` und `THIRD-PARTY-NOTICES.md`.

## Dateien

| Datei | Aktuelle Aufgabe |
|---|---|
| `index.html` | HTML-Struktur der sechs Etappen, Startseite, Ergebnisrad und externe Laufzeitressourcen |
| `style.css` | gesamtes UI-Design, Pergamentflächen, Radgestell, responsive Darstellung, Gamification und Gewinnerproklamation |
| `script.js` | Abstimmungsablauf, Raum-/Online-Modus, Ergebnisliste, Farbzuordnung, gewichtete Zufallsauswahl und UI-Radanimation |
| `effects.js` | dezente, auf 30 FPS begrenzte Mausneigung/Schwebe-Bewegung der Oberfläche auf Geräten mit feinem Zeiger |
| `vr-scene.js` | Three.js-Marktszene, Szenenwechsel, adaptive Qualität und atmosphärisches 3D-Glücksrad |
| `medieval-atmosphere.js` | prozedurale Web-Audio-Klangkulisse und Sound-Feedback |
| `config.js` | lokale Supabase-Konfiguration; im Repository mit Platzhaltern |
| `config.example.js` | Vorlage für die Supabase-Konfiguration |
| `HISTORISCHE-GRUNDLAGE.md` | historische Einordnung und Quellen |
| `ASSET-NACHWEISE.md` | Übersicht über eigene/prozedurale Inhalte und externe Medienressourcen |
| `THIRD-PARTY-NOTICES.md` | Bibliotheken, Fonts und Lizenzhinweise |

## Veröffentlichung über GitHub Pages

1. Falls der Online-Modus genutzt werden soll, `config.js` mit der gültigen Project URL und einem öffentlichen Supabase-Key konfigurieren.
2. Die Projektdateien in das Stammverzeichnis des GitHub-Repositories hochladen.
3. Unter **Settings → Pages** die Veröffentlichung aus dem Branch `main` und `/ (root)` aktivieren.
4. Nach Änderungen an CSS oder JavaScript die Seite mit geleertem Cache oder in einem privaten Fenster prüfen.
5. Den vollständigen Ablauf testen: Start → Erstellung/Beitritt → Modus → Stimme → Abstimmung schließen → Rad starten → Rad anhalten → Gewinnerproklamation.

## Lokaler Test

Im Projektordner:

```bash
python3 -m http.server 8000
```

Danach im Browser:

```text
http://localhost:8000
```

## Technik

- HTML5
- CSS
- JavaScript ohne Build-Schritt
- Three.js 0.160.0
- Web Audio API
- Supabase JavaScript Client 2.x (optional für den Online-Modus)
- Google Fonts
- GitHub Pages
