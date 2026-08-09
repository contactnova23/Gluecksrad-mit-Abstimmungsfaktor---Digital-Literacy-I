# Glücksrad mit Abstimmungsfaktor – Mittelalterlicher Glückshafen Basel

Web-App-Prototyp für die Prüfungsleistung in Digital Literacy I.

Live-Version des bisherigen Projekts:
https://contactnova23.github.io/Gluecksrad-mit-Abstimmungsfaktor---Digital-Literacy-I/

## Wichtig vor dem Upload

Die Datei `config.js` enthält bewusst Platzhalter. Übertrage dort die **Project URL** und den **Publishable Key** aus deiner bisherigen funktionierenden `config.js`.

Verwende im Browser ausschließlich einen öffentlichen Publishable-/Anon-Key. Ein `service_role`- oder Secret-Key darf niemals in GitHub Pages veröffentlicht werden.

Wenn du die bestehende `config.js` im Repository beibehältst, kannst du stattdessen alle übrigen Dateien aus diesem Paket hochladen und `config.js` beim Ersetzen auslassen.

## Unveränderte Texte

Die sichtbaren Texte der sechs App-Fenster wurden nicht umformuliert. Der Ablauf bleibt:

1. Start
2. Auswahl
3. Frage und Antworten
4. Abstimmungsort
5. Stimmabgabe
6. Glücksrad und Gewinnerverkündung

Geändert wurden ausschließlich Gestaltung, 3D-Szenerie, Inszenierung, Performance und Klangkulisse.

## Inhalt dieser Version

- spätmittelalterlich inspirierter Basler Markt- und Festplatz
- Marktbuden, Pflaster, Brunnen, Banner, Waren, Schießscheiben und Publikum
- Glückshafen-Stand mit Lostopf und ausgestellten Gaben
- großes hölzernes Glücksrad mit langem, sichtbar auf dem Boden stehendem A-Gestell
- separates Podest für die Gewinnerverkündung
- Basler Stadtmauer-/Torsilhouette statt eines märchenhaften Schlosses
- szenenabhängige Kamera- und Kulissenabschnitte
- prozedurale Marktklänge ohne fremde Audiodateien
- Sound-Schalter oben rechts
- adaptive Qualitätsstufen für Desktop, Mobilgeräte und schwächere Hardware
- pausierte 3D- und Audioverarbeitung bei inaktivem Browser-Tab
- statische Schatten und reduzierte Pixel-Dichte auf leistungsschwächeren Geräten
- vollständig nutzbare App auch dann, wenn WebGL nicht geladen werden kann

## Idee

Die App verbindet eine Abstimmung mit einem Glücksrad.

Die abgegebenen Stimmen beeinflussen die Wahrscheinlichkeit auf dem Glücksrad: Eine Antwort mit mehr Stimmen erhält einen größeren Anteil am Rad und damit eine höhere Gewinnchance.

Die meistgewählte Antwort gewinnt jedoch nicht automatisch – das Ergebnis bleibt zufallsbasiert.

## Funktionen

- Klarer 6-Fenster-Ablauf: Start → Auswahl → Frage & Antworten → Abstimmungsort → Stimmen → Glücksrad
- Eigene Abstimmungsfrage erstellen
- Beliebig viele Antwortmöglichkeiten hinzufügen
- Doppelte Antwortmöglichkeiten werden verhindert
- Stimmen abgeben
- Gewichtetes Glücksrad
- Glücksrad starten und manuell stoppen
- Gewinner anzeigen
- Raum-Modus auf einem gemeinsamen Gerät
- Online-Modus über Supabase und Raumcode

## Historisch inspirierte Atmosphäre

Der historische Glückshafen war vor allem ein Losgefäß beziehungsweise ein Stand, an dem Lose gezogen und Warenpreise vergeben wurden. Das digitale Glücksrad bleibt als verständliche Visualisierung der gewichteten Abstimmung erhalten, wird aber als vormodernes Marktgerät aus Holz inszeniert.

Die historische Einordnung und Quellen sind in `HISTORISCHE-GRUNDLAGE.md` dokumentiert.

## Urheberrecht und Medien

Für diese Fassung wurden keine fremden Fotos, Illustrationen, 3D-Modelle, Musikstücke oder Geräuschdateien eingebunden.

- Pflaster und Oberflächen werden zur Laufzeit prozedural erzeugt.
- Die komplette 3D-Welt besteht aus selbst erzeugten Three.js-Grundformen.
- Wind, Marktgemurmel, Holzklappern und Glocken werden mit der Web Audio API synthetisiert.
- Es werden keine Audiodateien heruntergeladen oder weiterverbreitet.

Weitere Hinweise stehen in `ASSET-NACHWEISE.md` und `THIRD-PARTY-NOTICES.md`.

## Dateien

| Datei | Aufgabe |
|---|---|
| `index.html` | Struktur der App; sichtbare Fenstertexte unverändert |
| `style.css` | Oberfläche, Holz-/Pergamentgestaltung und realistischeres UI-Rad |
| `script.js` | Abstimmungslogik, gewichtete Ziehung und Szenenereignisse |
| `effects.js` | ressourcenschonende Mausneigung der Tafel |
| `vr-scene.js` | prozedurale 3D-Welt, Szenenwechsel und 3D-Glücksrad |
| `medieval-atmosphere.js` | prozedurale, urheberrechtsfreie Klangkulisse |
| `config.js` | Supabase-Zugang mit einzutragender Project URL und Publishable Key |
| `config.example.js` | Sicherheitskopie der Konfigurationsvorlage |
| `.nojekyll` | sorgt für unveränderte Auslieferung über GitHub Pages |

## Veröffentlichung über GitHub Pages

1. `config.js` prüfen beziehungsweise die bisher funktionierenden Supabase-Werte übertragen.
2. Alle Dateien in das Stammverzeichnis des GitHub-Repositories hochladen.
3. In GitHub unter **Settings → Pages** die Veröffentlichung aus dem Branch `main` und dem Ordner `/ (root)` aktivieren.
4. Nach dem Deployment die Seite einmal mit geleertem Cache oder in einem privaten Browserfenster öffnen.
5. Raum-Modus, Online-Modus, Radstart, Radstopp, Gewinnerdialog und Sound-Schalter testen.

## Lokaler Test

Im Projektordner:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

## Technik

- HTML
- CSS
- JavaScript
- Three.js über jsDelivr
- Web Audio API
- Supabase
- GitHub Pages
