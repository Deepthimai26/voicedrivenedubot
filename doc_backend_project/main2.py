# main.py
import os
import shutil
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from embeddings.hf_embedder import process_and_embed, embed_texts, load_faiss_index, load_metadata
import requests
import numpy as np

# ----------------- Environment -----------------
load_dotenv()
A4F_API_KEY = os.getenv("A4F_API_KEY")
MODEL_NAMES = os.getenv("A4F_MODEL_NAMES", "provider-3/gpt-4o-mini").split(",")  # comma-separated in .env

FAISS_INDEX_FILE = "faiss_index.index"
METADATA_FILE = "metadata.pkl"
SIMILARITY_THRESHOLD = 0.3
TOP_K_DEFAULT = 5
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit

app = FastAPI(title="Document QA Backend")

# ----------------- A4F API Helper -----------------
def ask_a4f_api(question: str, context_text: str, model_name: str):
    headers = {
        "Authorization": f"Bearer {A4F_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a helpful document assistant. Use only the provided context "
                    "from uploaded files to answer the question. Include technical details, "
                    "formulas, headings, tables, and examples if relevant."
                )
            },
            {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion:\n{question}"}
        ],
        "max_tokens": 1200
    }

    try:
        response = requests.post("https://api.a4f.co/v1/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error calling A4F API: {e}"

# ----------------- Upload & Embed -----------------
@app.post("/extract")
async def extract_files(files: list[UploadFile]):
    added_files = []

    for file in files:
        try:
            # Read file into memory temporarily to check size
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"File too large: {file.filename}")

            upload_dir = "uploads"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as f:
                f.write(contents)

            # Reset pointer after reading
            file.file.seek(0)

            embeddings, metadata = process_and_embed(file_path, faiss_index_file=FAISS_INDEX_FILE,
                                                     metadata_file=METADATA_FILE, force_reprocess=True, fast_mode=True)

            added_files.append({
                "filename": file.filename,
                "status": "processed",
                "embeddings_added": embeddings.shape[0] if embeddings is not None else 0,
                "metadata_added": len(metadata) if metadata is not None else 0
            })

        except Exception as e:
            added_files.append({
                "filename": file.filename,
                "status": "error",
                "detail": str(e)
            })

    return JSONResponse({"files": added_files})

# ----------------- Query -----------------
@app.post("/query")
async def query_docs(
    question: str = Form(...),
    model: str = Form(MODEL_NAMES[0]),
    top_k: int = Form(TOP_K_DEFAULT)
):
    if model not in MODEL_NAMES:
        raise HTTPException(status_code=400, detail=f"Invalid model. Choose from: {MODEL_NAMES}")

    index = load_faiss_index(FAISS_INDEX_FILE)
    metadata = load_metadata(METADATA_FILE)

    if not index or index.ntotal == 0:
        return JSONResponse({
            "question": question,
            "answer": "FAISS index is empty. Please upload and extract files first.",
            "retrieved_chunks": 0,
            "used_context": False
        })

    query_vector = embed_texts([question])[0].reshape(1, -1).astype("float32")
    distances, indices = index.search(query_vector, top_k)

    if indices.shape[1] == 0:
        return JSONResponse({
            "question": question,
            "answer": "No relevant content found in FAISS.",
            "retrieved_chunks": 0,
            "used_context": False
        })

    context_chunks = []
    retrieved_files = set()
    for rank, idx in enumerate(indices[0], start=1):
        if idx >= len(metadata):
            continue
        sim_score = distances[0][rank-1]
        if sim_score < SIMILARITY_THRESHOLD:
            continue

        key = list(metadata.keys())[idx]
        meta = metadata[key]
        content = meta.get("content") or meta.get("caption") or meta.get("table_text") or ""
        if not content or "IMAGE_CAPTION_PLACEHOLDER" in content:
            continue

        context_chunks.append(f"[File: {meta.get('source','N/A')}, Type: {meta.get('type','N/A')}]\n{content}")
        retrieved_files.add(meta.get("source","N/A"))

    context_text = "\n\n".join(context_chunks) if context_chunks else "No relevant context retrieved."
    print(f"[INFO] Using retrieved data from FAISS. Sources: {', '.join(retrieved_files)}")
    print(f"[INFO] {len(context_chunks)} chunks retrieved.")

    answer = ask_a4f_api(question, context_text, model)

    return JSONResponse({
        "question": question,
        "answer": answer,
        "retrieved_chunks": len(context_chunks),
        "used_context": bool(context_chunks)
    })

# ----------------- Root -----------------
@app.get("/")
async def root():
    return {"status": "Document QA backend is running."}
