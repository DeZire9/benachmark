from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import os
from supabase import create_client, Client

from benachmark import compare_prices

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

class Part(BaseModel):
    manufacturer: str
    part_number: str


def store_part(part: Part):
    if not supabase:
        return
    supabase.table("parts").insert({
        "manufacturer": part.manufacturer,
        "part_number": part.part_number,
    }).execute()
    # price comparison and store results
    comparison = compare_prices({
        "Hersteller": part.manufacturer,
        "Herstellerteilenummer": part.part_number,
    })
    supabase.table("comparisons").insert({
        "manufacturer": comparison["manufacturer"],
        "part_number": comparison["part_number"],
        "our_price": comparison.get("our_price"),
        "difference": comparison.get("difference"),
    }).execute()

@app.post("/upload")
async def upload(part: Part, background_tasks: BackgroundTasks):
    background_tasks.add_task(store_part, part)
    return {"status": "accepted"}
