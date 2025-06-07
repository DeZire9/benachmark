# Supabase Upload UI

Eine minimalistische Weboberfläche zum Hochladen von CSV- oder Excel-Dateien. Die Anwendung nutzt Supabase zur Authentifizierung. Nach dem Login kann eine Datei ausgewählt werden, deren Inhalt im Browser angezeigt wird.

Im eingeloggten Zustand stehen außerdem Beispiel-Dateien zum Download bereit. Die vorhandene `sample.csv` wird dabei auf Wunsch automatisch in eine `sample.xlsx` umgewandelt.

## Starten

1. `cd frontend`
2. `cp .env.example .env` und die Supabase-Parameter sowie den Bucket-Namen eintragen
3. `yarn install`
4. `yarn dev`

Die Seite ist anschließend unter `http://localhost:5173` erreichbar.
