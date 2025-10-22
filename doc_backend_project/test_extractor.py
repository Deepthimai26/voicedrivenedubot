from extractors.pptx_extractor import extract_from_pptx
from extractors.docx_extractor import extract_from_docx
from extractors.image_extractor import extract_from_image
from extractors.table_extractor import extract_tables_from_pdf, extract_tables_from_docx, extract_tables_from_pptx, save_tables_to_csv
import os

# ---------------- Test PPTX ----------------
pptx_file = "samples/sample.pptx"
pptx_result = extract_from_pptx(pptx_file)
print("PPTX Text:", pptx_result["text"])
print("PPTX Images saved at:", pptx_result["image_dir"])

pptx_tables = extract_tables_from_pptx(pptx_file)
print("PPTX Tables Found:", len(pptx_tables))
save_tables_to_csv(pptx_tables, "extracted_data/pptx_tables", "sample_pptx")

# ---------------- Test DOCX ----------------
docx_file = "samples/sample.docx"
docx_result = extract_from_docx(docx_file)
print("DOCX Text:", docx_result["text"])
print("DOCX Images saved at:", docx_result["image_dir"])

docx_tables = extract_tables_from_docx(docx_file)
print("DOCX Tables Found:", len(docx_tables))
save_tables_to_csv(docx_tables, "extracted_data/docx_tables", "sample_docx")

# ---------------- Test Images ----------------
image_file = "samples/sample.png"
image_result = extract_from_image(image_file)
print("Image Text:", image_result["text"])
print("Image saved at:", image_result["image_dir"])

# ---------------- Test PDF Tables ----------------
pdf_file = "samples/sample.pdf"
pdf_tables = extract_tables_from_pdf(pdf_file)
print("PDF Tables Found:", len(pdf_tables))
save_tables_to_csv(pdf_tables, "extracted_data/pdf_tables", "sample_pdf")
