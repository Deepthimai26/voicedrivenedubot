# db/faiss.py
from embeddings.hf_embedder import embed_texts, load_faiss_index, load_metadata
import numpy as np

FAISS_INDEX_FILE = "faiss_index.index"
METADATA_FILE = "metadata.pkl"
SIMILARITY_THRESHOLD = 0.3
TOP_K_DEFAULT = 5

def query_faiss(question: str, top_k: int = TOP_K_DEFAULT):
    """
    Embed the question and retrieve top-k chunks from FAISS with similarity filtering.
    Returns a list of dicts: {"distance", "metadata", "content"}.
    """
    index = load_faiss_index(FAISS_INDEX_FILE)
    metadata = load_metadata(METADATA_FILE)

    if not index or index.ntotal == 0:
        return []

    query_vector = embed_texts([question])[0].reshape(1, -1).astype("float32")
    distances, indices = index.search(query_vector, top_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if dist < SIMILARITY_THRESHOLD:
            continue
        key_list = list(metadata.keys())
        if idx >= len(key_list):
            continue
        key = key_list[idx]
        meta = metadata[key]
        content = meta.get("content") or meta.get("caption") or meta.get("table_text") or ""
        if content:
            results.append({"distance": float(dist), "metadata": meta, "content": content})
    return results
