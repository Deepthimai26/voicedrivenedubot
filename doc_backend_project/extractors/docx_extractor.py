from docx import Document
import os
from PIL import Image
from io import BytesIO

def extract_from_docx(file_path, output_dir="extracted_data/docx"):
    os.makedirs(output_dir, exist_ok=True)
    doc = Document(file_path)
    text_content = []

    # ---- Extract Text ----
    for para in doc.paragraphs:
        text_content.append(para.text)

    # ---- Extract Images ----
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            image_data = rel.target_part.blob
            image = Image.open(BytesIO(image_data))
            image_filename = f"image_{len(os.listdir(output_dir)) + 1}.png"
            image.save(os.path.join(output_dir, image_filename))

    return {"text": "\n".join(text_content), "image_dir": output_dir}
