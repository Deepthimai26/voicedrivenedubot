from PIL import Image
import pytesseract
import os

def extract_from_image(file_path, output_dir="extracted_data/images"):
    os.makedirs(output_dir, exist_ok=True)
    image = Image.open(file_path)

    # ---- Extract Text ----
    text = pytesseract.image_to_string(image)

    # Optionally save a copy
    image.save(os.path.join(output_dir, os.path.basename(file_path)))

    return {"text": text, "image_dir": output_dir}
