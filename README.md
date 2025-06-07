# Supabase Upload UI

Eine minimalistische Weboberfläche zum Hochladen von CSV- oder Excel-Dateien. Die Anwendung nutzt Supabase zur Authentifizierung. Nach dem Login kann eine Datei ausgewählt werden, deren Inhalt im Browser angezeigt wird.

Im eingeloggten Zustand stehen Beispiel-Dateien im `uploads` Storage zum Download bereit (`sample.csv` und `sample.xlsx`).

## Starten

1. `cd frontend`
2. `cp .env.example .env` und die Supabase-Parameter sowie den Bucket-Namen eintragen
3. `yarn install`
4. `yarn dev`

Die Seite ist anschließend unter `http://localhost:5173` erreichbar.

## Database Setup

Before running the app, execute the following SQL in your Supabase project:

```sql
create table file_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  filename text not null,
  uploaded_at timestamptz not null default now()
);
alter table file_uploads enable row level security;
create policy "allow user inserts" on file_uploads
  for insert with check (auth.uid() = user_id);
create policy "allow user read" on file_uploads
  for select using (auth.uid() = user_id);
```

After creating the table, make sure to add a storage bucket named `uploads`
in your Supabase project. The frontend expects the bucket name from the
`VITE_STORAGE_BUCKET` environment variable.

To allow authenticated users to interact with the bucket, run the following
policies on `storage.objects`:

```sql
CREATE POLICY "Logged-in users can read uploads"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'uploads' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Logged-in users can upload to uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Logged-in users can update uploads"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'uploads' AND auth.role() = 'authenticated'
  );
```

## Job Results Table

Die Preise anderer Onlineshops werden nach Abschluss des Jobs in einer eigenen
Tabelle gespeichert. Diese Tabelle kann mit folgendem SQL erstellt werden:

```sql
create table price_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  manufacturer text not null,
  part_no text not null,
  shop text not null,
  price numeric not null,
  currency text default 'EUR',
  collected_at timestamptz not null default now()
);
alter table price_results enable row level security;
create policy "allow user inserts" on price_results
  for insert with check (auth.uid() = user_id);
create policy "allow user read" on price_results
  for select using (auth.uid() = user_id);
```


## Backend Job

Der Ordner `backend` enthält ein kleines Node.js Skript `price-job.js`. Es lädt eine hochgeladene Datei aus dem Supabase Storage herunter, ruft für jede Zeile Beispielpreise über `dummyjson.com` ab und speichert diese in der Tabelle `price_results`.

### Ausführen

1. `cd backend`
2. `npm install`
3. Die folgenden Umgebungsvariablen setzen:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - optional `STORAGE_BUCKET` (Standard `uploads`)
4. `node price-job.js <USER_ID> <STORAGE_PATH> <DATEINAME>`

`USER_ID` ist die ID des Nutzers, `STORAGE_PATH` der Pfad der Datei im Bucket und `DATEINAME` der Dateiname (z.B. `sample.csv`).

### API Server

Um den Job aus dem Frontend starten zu können, kann ein kleiner Express-Server gestartet werden. Dieser stellt unter `/run-job` einen Endpunkt bereit, der den Preis-Job ausführt.

```
cd backend
npm run server
```
