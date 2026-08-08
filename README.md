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

- Eigene Abstimmungsfrage erstellen
- Beliebig viele Antwortmöglichkeiten hinzufügen
- Doppelte Antwortmöglichkeiten werden verhindert
- Stimmen abgeben
- Gewichtetes Glücksrad
- Glücksrad starten und manuell stoppen
- Gewinner anzeigen

## Abstimmungsarten

### Einfacher Modus

Eine Abstimmung kann direkt auf einem Gerät durchgeführt und getestet werden.

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
