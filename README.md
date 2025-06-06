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

## Weboberfläche

Ein kleines Web UI auf Basis von React und TypeScript befindet sich im Verzeichnis `frontend`. Die zugehörige API wird mit FastAPI bereitgestellt.

### Starten der API

Die API erwartet die Umgebungsvariablen `SUPABASE_URL` und `SUPABASE_KEY` um Daten in Supabase zu speichern. Anschließend kann die API mit uvicorn gestartet werden:

```bash
uvicorn api.main:app --reload
```

### Starten des Frontends

Im `frontend` Verzeichnis befinden sich eine minimale Vite-Konfiguration. Nach der Installation der Node-Abhängigkeiten kann das UI im Entwicklungsmodus gestartet werden:

```bash
cd frontend
npm install
npm run dev
```

Die Anwendung bietet ein Formular zum Upload von Hersteller und Teilenummer. Nach dem Absenden werden die Daten an die API gesendet, in Supabase gespeichert und der Preisvergleich als Hintergrundaufgabe gestartet.
