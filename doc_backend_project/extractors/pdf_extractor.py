import fitz  # PyMuPDF
import os

def extract_from_pdf(file_path, output_dir="extracted_data/pdf"):
    os.makedirs(output_dir, exist_ok=True)
    text_content = []

    with fitz.open(file_path) as pdf:
        for page_num, page in enumerate(pdf):
            # ---- Extract Text ----
            text = page.get_text("text")
            if text.strip():
                text_content.append(text)

            # ---- Extract Images ----
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list, start=1):
                xref = img[0]
                base_image = pdf.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                image_filename = f"page{page_num+1}_img{img_index}.{image_ext}"
                image_path = os.path.join(output_dir, image_filename)

                with open(image_path, "wb") as img_file:
                    img_file.write(image_bytes)

    return {"text": "\n".join(text_content), "image_dir": output_dir}
