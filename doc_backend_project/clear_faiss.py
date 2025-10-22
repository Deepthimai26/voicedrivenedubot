import shutil
import os

FAISS_DIR = "faiss_indexes"

if os.path.exists(FAISS_DIR):
    shutil.rmtree(FAISS_DIR)
    os.makedirs(FAISS_DIR, exist_ok=True)
    print("Cleared all FAISS indexes and metadata!")
