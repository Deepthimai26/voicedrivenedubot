# routers/docmode.py
import os
import shutil
from fastapi import APIRouter, UploadFile, Form
from fastapi.responses import JSONResponse
from embeddings.hf_embedder import process_and_embed, embed_texts, load_faiss_index, load_metadata
from dotenv import load_dotenv
import requests
from glob import glob

# ----------------- Environment -----------------
load_dotenv()
A4F_API_KEY = os.getenv("A4F_API_KEY")
MODEL_NAMES = os.getenv("A4F_MODEL_NAMEs", "provider-3/gpt-4o-mini").split(",")
SIMILARITY_THRESHOLD = 0.3
TOP_K_DEFAULT = 5

UPLOAD_DIR = "uploads"
FAISS_DIR = "faiss_indexes"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FAISS_DIR, exist_ok=True)

router = APIRouter()

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
@router.post("/extract")
async def extract_files(files: list[UploadFile]):
    results = []

    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        try:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)

            # Each file gets its own FAISS index & metadata
            faiss_index_file = os.path.join(FAISS_DIR, f"{file.filename}.index")
            metadata_file = os.path.join(FAISS_DIR, f"{file.filename}_metadata.pkl")

            embeddings, metadata = process_and_embed(
                file_path,
                faiss_index_file=faiss_index_file,
                metadata_file=metadata_file,
                force_reprocess=True,
                fast_mode=True
            )

            # Safe checks for NumPy arrays and dicts
            num_embeddings = len(embeddings) if embeddings is not None else 0
            num_metadata = len(metadata) if metadata is not None else 0

            results.append({
                "filename": file.filename,
                "status": "processed",
                "embeddings_added": num_embeddings,
                "metadata_added": num_metadata
            })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "detail": str(e)
            })

    return JSONResponse({"files": results})

# ----------------- Query -----------------
@router.post("/query")
async def query_docs(
    question: str = Form(...),
    model: str = Form(MODEL_NAMES[0]),
    top_k: int = Form(TOP_K_DEFAULT)
):
    # Load latest FAISS index
    index_files = sorted(glob(os.path.join(FAISS_DIR, "*.index")), key=os.path.getmtime, reverse=True)
    if not index_files:
        return JSONResponse({
            "question": question,
            "answer": "No FAISS index found. Upload and extract files first.",
            "retrieved_chunks": 0,
            "used_context": False
        })

    faiss_index_file = index_files[0]
    metadata_file = faiss_index_file.replace(".index", "_metadata.pkl")

    index = load_faiss_index(faiss_index_file)
    metadata = load_metadata(metadata_file)

    if not index or index.ntotal == 0:
        return JSONResponse({
            "question": question,
            "answer": "FAISS index is empty. Please upload and extract files first.",
            "retrieved_chunks": 0,
            "used_context": False
        })

    # Embed the query
    query_vector = embed_texts([question])[0].reshape(1, -1).astype("float32")
    distances, indices = index.search(query_vector, top_k)

    context_chunks = []
    retrieved_files = set()
    metadata_list = list(metadata.values())

    for rank, idx in enumerate(indices[0]):
        if idx >= len(metadata_list):
            continue
        sim_score = distances[0][rank]
        if sim_score < SIMILARITY_THRESHOLD:
            continue

        meta = metadata_list[idx]
        content = meta.get("content") or meta.get("caption") or meta.get("table_text") or ""
        if not content:
            continue

        context_chunks.append(f"[File: {meta.get('source','N/A')}, Type: {meta.get('type','N/A')}]\n{content}")
        retrieved_files.add(meta.get("source","N/A"))

    context_text = "\n\n".join(context_chunks) if context_chunks else "No relevant context retrieved."
    print(f"[INFO] Using retrieved data from FAISS. Sources: {', '.join(retrieved_files)}")
    print(f"[INFO] {len(context_chunks)} chunks retrieved.")

    answer = ask_a4f_api(question, context_text, model_name=model)

    return JSONResponse({
        "question": question,
        "answer": answer,
        "retrieved_chunks": len(context_chunks),
        "used_context": bool(context_chunks)
    })
@router.get("/models")
async def get_models():
    """
    Return available model names loaded from the .env (MODEL_NAMES).
    Mounted at GET /doc/models (because router is mounted with prefix="/doc").
    """
    try:
        return JSONResponse({"models": MODEL_NAMES})
    except Exception as e:
        return JSONResponse({"error": "Failed to load models", "detail": str(e)}, status_code=500)


# ----------------- Health Check -----------------
@router.get("/")
async def root():
    return {"status": "Doc Mode backend is running."}
