# extractors/captioner_preload.py
import os
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from concurrent.futures import ThreadPoolExecutor

# Initialize model once
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def generate_caption(image_path: str):
    """Generate caption for a single image"""
    try:
        image = Image.open(image_path).convert("RGB")
        max_dim = 384
        image.thumbnail((max_dim, max_dim))
        inputs = processor(images=image, return_tensors="pt")
        out = model.generate(**inputs, max_new_tokens=50)
        caption = processor.decode(out[0], skip_special_tokens=True)
        return caption
    except Exception as e:
        return f"Caption generation failed: {e}"

def generate_captions_parallel(image_paths, max_workers=4, fast_mode=False):
    """Generate captions in parallel"""
    if fast_mode:
        return ["IMAGE_CAPTION_PLACEHOLDER"] * len(image_paths)

    captions = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = executor.map(generate_caption, image_paths)
        captions = list(results)
    return captions
