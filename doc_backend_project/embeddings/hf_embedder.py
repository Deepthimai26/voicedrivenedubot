# embeddings/hf_embedder.py
import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from extractors.pdf_extractor import extract_from_pdf
from extractors.docx_extractor import extract_from_docx
from extractors.pptx_extractor import extract_from_pptx
from extractors.image_extractor import extract_from_image
from extractors.captioner_preload import generate_caption
from extractors.table_extractor import (
    extract_tables_from_pdf,
    extract_tables_from_docx,
    extract_tables_from_pptx
)

print("[INFO] Loading embedding model (all-MiniLM-L6-v2)...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("[INFO] Model loaded successfully.")

def embed_texts(texts):
    if not texts:
        return np.array([]).reshape(0, model.get_sentence_embedding_dimension())
    return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

def create_faiss_index(embeddings, dim=384, index_file="faiss_index.index"):
    index = faiss.IndexFlatIP(dim)
    index.add(np.array(embeddings))
    faiss.write_index(index, index_file)
    return index_file

def load_faiss_index(index_file="faiss_index.index"):
    if os.path.exists(index_file):
        return faiss.read_index(index_file)
    return None

def save_metadata(metadata, file_path="metadata.pkl"):
    with open(file_path, "wb") as f:
        pickle.dump(metadata, f)

def load_metadata(file_path="metadata.pkl"):
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            return pickle.load(f)
    return {}

def chunk_text(text, chunk_size=400, overlap=50):
    if not text:
        return []
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def process_file(file_path, fast_mode=True):
    ext = file_path.split(".")[-1].lower()
    all_texts, metadata = [], []

    if ext == "pdf":
        result = extract_from_pdf(file_path)
        tables = extract_tables_from_pdf(file_path)
    elif ext == "docx":
        result = extract_from_docx(file_path)
        tables = extract_tables_from_docx(file_path)
    elif ext == "pptx":
        result = extract_from_pptx(file_path)
        tables = extract_tables_from_pptx(file_path)
    elif ext in ["png", "jpg", "jpeg", "bmp"]:
        result = extract_from_image(file_path)
        tables = []
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    # ---- Text Chunks ----
    text_content = result.get("text") or ""
    if text_content:
        for chunk in chunk_text(text_content):
            all_texts.append(chunk)
            metadata.append({"type":"text","source":file_path,"content":chunk})

    # ---- Tables ----
    for i, table in enumerate(tables):
        table_text = table.to_csv(index=False)
        for chunk in chunk_text(table_text):
            all_texts.append(chunk)
            metadata.append({"type":"table","source":file_path,"table_index":i,"table_text":chunk})

    # ---- Images ----
    if "image_dir" in result and os.path.exists(result["image_dir"]):
        for img_file in os.listdir(result["image_dir"]):
            img_path = os.path.join(result["image_dir"], img_file)
            caption = ""
            if not fast_mode:
                caption = generate_caption(img_path) or ""
                if caption:
                    all_texts.append(caption)
            metadata.append({"type":"image","source":img_path,"caption":caption})

    return all_texts, metadata

def process_and_embed(file_path, faiss_index_file="faiss_index.index",
                      metadata_file="metadata.pkl", force_reprocess=False, fast_mode=True):
    index = load_faiss_index(faiss_index_file)
    metadata_existing = load_metadata(metadata_file)

    if not force_reprocess and any(file_path in str(key) for key in metadata_existing.keys()):
        print(f"[INFO] File {file_path} already processed. Skipping.")
        return None, None

    texts, metadata_new = process_file(file_path, fast_mode=fast_mode)
    if not texts:
        print(f"[INFO] No text to embed for {file_path}.")
        return None, metadata_new

    embeddings = embed_texts(texts)
    if embeddings.size == 0:
        return None, metadata_new

    if index is None:
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
    elif index.d != embeddings.shape[1]:
        raise ValueError(f"FAISS dim mismatch: {index.d} != {embeddings.shape[1]}")

    index.add(np.array(embeddings))
    faiss.write_index(index, faiss_index_file)

    for i, m in enumerate(metadata_new):
        metadata_existing[f"{file_path}_{i}"] = m
    save_metadata(metadata_existing, metadata_file)

    print(f"[INFO] File {file_path} embedded successfully. Added {len(texts)} chunks.")
    return embeddings, metadata_new
