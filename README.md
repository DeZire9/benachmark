# Benachmark

Dieses Projekt stellt ein einfaches Kommandozeilenwerkzeug bereit, um Preise von Produkten im Internet mit dem eigenen Verkaufspreis zu vergleichen.

## Installation

Python 3 wird vorausgesetzt. Notwendige Abhängigkeiten können mit `pip` installiert werden:

```bash
pip install -r requirements.txt
```

## Nutzung

Die Anwendung erwartet eine CSV- oder Excel-Datei mit folgenden Spalten:

- `Herstellerteilenummer` oder `PartNumber`
- `Hersteller` oder `Manufacturer`
- optional `Verkaufspreis` oder `OurPrice`

Anschließend wird das Skript gestartet und die Datei übergeben:

```bash
python benachmark.py daten.csv
```

Das Skript versucht, anhand der Herstellerteilenummer und des Herstellers Preise im Internet zu finden und vergleicht diese mit dem eigenen Preis.

Bitte beachten: In dieser Beispielimplementierung werden die Suchergebnisse über DuckDuckGo abgefragt. Ohne Internetverbindung liefert das Skript keine Treffer.
