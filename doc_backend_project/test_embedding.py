# test_embedding.py
import os
from embeddings.hf_embedder import process_and_embed, load_faiss_index, load_metadata

# ----------------- Test Files -----------------
test_files = [
    "samples/sample.pdf",
  # can be jpg/jpeg as well
]

faiss_index_file = "faiss_index.index"
metadata_file = "metadata.pkl"

# ----------------- Load existing FAISS index and metadata -----------------
index = load_faiss_index(faiss_index_file)
metadata = load_metadata(metadata_file)

print(f"[INFO] Existing FAISS vectors: {index.ntotal if index else 0}")
print(f"[INFO] Existing metadata entries: {len(metadata)}\n")

# ----------------- Process Files -----------------
for file_path in test_files:
    if not os.path.exists(file_path):
        print(f"[WARN] File not found: {file_path}. Skipping.")
        continue

    embeddings, metadata_new = process_and_embed(
        file_path, 
        faiss_index_file=faiss_index_file,
        metadata_file=metadata_file
    )

    if embeddings is not None:
        print(f"[SUCCESS] File processed: {file_path}")
        print(f" - Embeddings shape: {embeddings.shape}")
        print(f" - Metadata entries added: {len(metadata_new)}")
    else:
        print(f"[SKIPPED] Already processed: {file_path}")

# ----------------- Final Verification -----------------
index = load_faiss_index(faiss_index_file)
metadata = load_metadata(metadata_file)

print("\n[FINAL STATUS]")
print(f"Total vectors in FAISS index: {index.ntotal if index else 0}")
print(f"Total metadata entries: {len(metadata)}")

# Optional: Quick test query
if index and index.ntotal > 0:
    print("\n[INFO] Performing test similarity check...")
    import numpy as np
    test_vector = np.random.rand(index.d).astype("float32")  # Random vector for quick test
    D, I = index.search(np.array([test_vector]), k=1)
    print(f"Closest vector index: {I[0][0]}, distance: {D[0][0]}")
else:
    print("[WARN] FAISS index empty. Embeddings not generated yet.")
