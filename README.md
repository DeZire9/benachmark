# Supabase Upload UI

Eine minimalistische Weboberfläche zum Hochladen von CSV- oder Excel-Dateien. Die Anwendung nutzt Supabase zur Authentifizierung. Nach dem Login kann eine Datei ausgewählt werden, deren Inhalt im Browser angezeigt wird.

Im eingeloggten Zustand stehen außerdem Beispiel-Dateien zum Download bereit. Die vorhandene `sample.csv` wird dabei auf Wunsch automatisch in eine `sample.xlsx` umgewandelt.

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

