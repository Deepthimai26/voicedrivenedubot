# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import docmode
from dotenv import load_dotenv
import os

# ----------------- Load Environment -----------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_KEY not set in .env")

# ----------------- FastAPI App -----------------
app = FastAPI(title="Document QA Backend")

# CORS middleware (allow Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # change if frontend URL is different
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include docmode router
app.include_router(docmode.router, prefix="/doc", tags=["Doc Mode"])

@app.get("/")
async def root():
    return {"status": "Document QA backend is running."}
