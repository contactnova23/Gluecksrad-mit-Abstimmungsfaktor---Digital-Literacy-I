# Glücksrad mit Abstimmungsfaktor – Digital Literacy I

Web-App-Prototyp für die Prüfungsleistung in Digital Literacy I.

Live-Version:
https://contactnova23.github.io/Gluecksrad-mit-Abstimmungsfaktor---Digital-Literacy-I/

## Idee

Die App verbindet eine Abstimmung mit einem Glücksrad.

Die abgegebenen Stimmen beeinflussen die Wahrscheinlichkeit auf dem Glücksrad:
Eine Antwort mit mehr Stimmen erhält einen größeren Anteil am Rad und damit eine höhere Gewinnchance.

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


## Dezente Gamification

Die App nutzt bewusst nur wenige spielerische Elemente, damit die Abstimmung einfach und verständlich bleibt:

- direktes visuelles Feedback nach einer abgegebenen Stimme
- eine deutlich hervorgehobene Auswahl des Abstimmungsmodus
- eine inszenierte Gewinnerverkündung mit animierter Zeremonie

Auf Punkte, Badges, Streaks oder Leaderboards wird bewusst verzichtet. Die geheime Abstimmung und die eigentliche Entscheidung durch das gewichtete Glücksrad bleiben im Mittelpunkt.

## Benutzerführung

Die Oberfläche ist bewusst in einzelne, klar abgegrenzte Fenster aufgeteilt:

1. Start mit Titel und Start-Button
2. Auswahl zwischen neuer Abstimmung und Teilnahme per Raumcode
3. Eingabe von Abstimmungsfrage und Antwortmöglichkeiten
4. Auswahl zwischen Raum-Modus und Online-Modus
5. Abgabe der Stimmen
6. Glücksrad mit gewichteten Segmenten und anschließender Gewinnerverkündung

Die 3D-Fairytale-Stadt bewegt sich passend zum Fortschritt der Nutzerinnen und Nutzer weiter.

## Historisch inspirierte Atmosphäre

Die visuelle Welt ist als helle, märchenhafte Interpretation einer spätmittelalterlichen Messe bzw. eines Schützenfestes gestaltet. Der Begriff **Glückshafen** bezeichnete historische Lotterie- bzw. Losveranstaltungen, die im Umfeld von Messen und Schützenfesten auftreten konnten.

Für die App wird diese historische Idee bewusst modernisiert: Der Glückshafen bildet die erzählerische Rahmung, während das gewichtete Glücksrad die digitale Entscheidungsmechanik sichtbar macht. Die Sprache ist mittelalterlich angehaucht, bleibt aber absichtlich verständlich und benutzerfreundlich.

Die 3D-Welt greift dazu Marktbuden, Banner, Schießscheiben, einen Glückshafen-Lostopf, ausgestellte Gaben und eine helle europäische Altstadt auf.

## Abstimmungsarten

Die App bietet bewusst zwei klar getrennte Mehrpersonen-Modi:

### Raum-Modus

Mehrere Personen stimmen nacheinander auf demselben Gerät ab.

Die bisherigen Ergebnisse und die Anzahl der abgegebenen Stimmen werden während der Abstimmung nicht angezeigt.

Erst nach dem Beenden der Abstimmung werden die Ergebnisse sichtbar.

### Online-Modus

Eine moderierende Person erstellt eine Online-Abstimmung.

Die App erzeugt einen Raumcode.

Andere Personen können die veröffentlichte Webseite auf ihrem eigenen Smartphone oder Computer öffnen, den Raumcode eingeben und der Abstimmung beitreten.

Die moderierende Person kann die Abstimmung anschließend beenden und das Glücksrad starten.

## Datenbank und Sicherheit

Für den Online-Modus wird Supabase verwendet.

Die App verwendet einen öffentlichen Supabase Publishable Key. Dieser ist für die Verwendung im Browser vorgesehen und kein geheimer Administrator-Schlüssel.

Für die Zugriffskontrolle werden verwendet:

- Supabase Anonymous Sign-In
- Row Level Security (RLS)
- eingeschränkte Datenbank-Policies

Teilnehmende erhalten dabei automatisch eine anonyme Supabase-Identität.

Die Datenbankregeln sorgen unter anderem dafür, dass:

- Teilnehmende nur an offenen Abstimmungen teilnehmen können
- nur die moderierende Person ihre Abstimmung beenden kann
- Teilnehmende nicht die Einzelstimmen anderer Personen auslesen können
- eine anonyme Identität pro Abstimmung nur einmal abstimmen kann

Hinweis:
Bei einer anonymen Anmeldung kann durch ein anderes Gerät oder das Löschen von Browserdaten eine neue Identität entstehen. Für eine vollständig manipulationssichere Anwendung wäre eine stärkere Authentifizierung erforderlich.

## Technik

Die Web-App wurde umgesetzt mit:

- HTML
- CSS
- JavaScript
- Supabase
- GitHub Pages

## Veröffentlichung

Die Anwendung ist über GitHub Pages erreichbar:

https://contactnova23.github.io/Gluecksrad-mit-Abstimmungsfaktor---Digital-Literacy-I/
