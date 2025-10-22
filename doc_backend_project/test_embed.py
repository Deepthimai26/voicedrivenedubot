from embeddings.hf_embedder import process_and_embed

file_path = "uploads/pdf1.pdf"
faiss_index_file = "faiss_index.index"
metadata_file = "metadata.pkl"


# New
embeddings, metadata_new = process_and_embed(
    file_path, 
    faiss_index_file=faiss_index_file,
    metadata_file=metadata_file
)

if embeddings is not None:
    print(f"File processed: {file_path}")
    print(f" - Embeddings shape: {embeddings.shape}")
    print(f" - Metadata entries added: {len(metadata_new)}")
else:
    print("File skipped or no content found.")
