from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import docmode

app = FastAPI(title="Document QA Backend")

# CORS (allow Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your Next.js dev URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include docmode router under /doc
app.include_router(docmode.router, prefix="/doc", tags=["Doc Mode"])

@app.get("/")
async def root():
    return {"status": "Document QA backend is running."}
