# faiss_to_a4f_chat_with_faiss_info.py
from dotenv import load_dotenv
import os
import numpy as np
import requests
from embeddings.hf_embedder import load_faiss_index, load_metadata, embed_texts

# ----------------- Load .env -----------------
load_dotenv()
A4F_API_KEY = os.getenv("A4F_API_KEY")
A4F_MODEL_NAME = os.getenv("A4F_MODEL_NAME")
FAISS_INDEX_FILE = "faiss_index.index"
METADATA_FILE = "metadata.pkl"
TOP_K = 5
SIMILARITY_THRESHOLD = 0.3  # Only include FAISS results above this similarity
A4F_API_URL = "https://api.a4f.co/v1/chat/completions"

if not A4F_API_KEY or not A4F_MODEL_NAME:
    print("[ERROR] Please set both A4F_API_KEY and A4F_MODEL_NAME in your .env file.")
    exit(1)

# ----------------- Load FAISS index and metadata -----------------
index = load_faiss_index(FAISS_INDEX_FILE)
metadata = load_metadata(METADATA_FILE)

if not index or index.ntotal == 0:
    print("[ERROR] FAISS index is empty. Run test_embedding first.")
    exit(1)

print(f"[INFO] Loaded FAISS index with {index.ntotal} vectors")
print(f"[INFO] Loaded {len(metadata)} metadata entries\n")

# ----------------- Interactive Query Loop -----------------
print("Type your query and press Enter (type 'exit' to quit)\n")

while True:
    query_text = input("Your query: ").strip()
    if query_text.lower() in ["exit", "quit"]:
        print("Exiting.")
        break
    if not query_text:
        continue

    # --- Embed the query ---
    query_vector = embed_texts([query_text])[0]
    query_vector = np.array([query_vector], dtype="float32")

    # --- Search top-k FAISS chunks ---
    distances, indices = index.search(query_vector, k=TOP_K)

    # --- Prepare context with similarity filtering ---
    context_chunks = []
    retrieved_files = set()
    print(f"\n[INFO] Top {TOP_K} FAISS results (filtered by similarity ≥ {SIMILARITY_THRESHOLD}):")
    for rank, idx in enumerate(indices[0], start=1):
        sim_score = distances[0][rank-1]
        if sim_score < SIMILARITY_THRESHOLD:
            continue  # Skip irrelevant chunks

        if idx < len(metadata):
            key = list(metadata.keys())[idx]
            meta = metadata[key]
            content = meta.get("content", meta.get("caption", ""))
            source_file = meta.get("source", "N/A")
            chunk_type = meta.get("type", "N/A")

            print(f"{rank}. File: {source_file}, Type: {chunk_type}, Distance: {sim_score:.4f}")
            print(f"    Preview: {content[:150].replace(chr(10), ' ')}...\n")

            # Skip empty or placeholder captions
            if content and "IMAGE_CAPTION_PLACEHOLDER" not in content:
                context_chunks.append(f"[File: {source_file}, Type: {chunk_type}]\n{content}")
                retrieved_files.add(source_file)
        else:
            print(f"{rank}. Index {idx} not found in metadata.")

    # --- Info message about FAISS usage ---
    if context_chunks:
        print(f"[INFO] Using retrieved data from FAISS. Sources: {', '.join(retrieved_files)}\n")
    else:
        print("[INFO] No relevant data found in FAISS. Answer will be generated from LLM's knowledge.\n")

    context_text = "\n\n".join(context_chunks) if context_chunks else "No relevant context retrieved."

    # --- Prepare chat payload ---
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Include formulas and technical content when relevant."},
        {"role": "user", "content": f"Context:\n{context_text}\n\nUser Question:\n{query_text}"}
    ]

    payload = {
        "model": A4F_MODEL_NAME,
        "messages": messages,
        "max_tokens": 800
    }

    headers = {
        "Authorization": f"Bearer {A4F_API_KEY}",
        "Content-Type": "application/json"
    }

    # --- Call A4F API ---
    try:
        response = requests.post(A4F_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        answer = response.json().get("choices", [{}])[0].get("message", {}).get("content", "No answer returned.")
        print("\n[LLM Answer]")
        print(answer)
    except Exception as e:
        print(f"[ERROR] Failed to get response from A4F API: {e}")

    print("\n" + "-"*80 + "\n")
