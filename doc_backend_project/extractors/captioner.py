import os
from PIL import Image
import pytesseract
import layoutparser as lp
from transformers import BlipProcessor, BlipForConditionalGeneration

# Initialize captioning model once
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def generate_caption(image_path: str):
    """Generate a short caption for an image, diagram, or flowchart"""
    try:
        image = Image.open(image_path).convert("RGB")
        inputs = processor(image, return_tensors="pt")
        out = model.generate(**inputs, max_new_tokens=50)
        caption = processor.decode(out[0], skip_special_tokens=True)
        return caption
    except Exception as e:
        return f"Caption generation failed: {e}"

def detect_layout_and_caption(image_path: str):
    """Detect layout blocks and generate captions"""
    image = Image.open(image_path).convert("RGB")
    model_lp = lp.Detectron2LayoutModel(
        config_path="lp://PubLayNet/faster_rcnn_R_50_FPN_3x/config",
        extra_config=["MODEL.ROI_HEADS.SCORE_THRESH_TEST", 0.8],
        label_map={0: "Text", 1: "Title", 2: "List", 3: "Table", 4: "Figure"},
    )

    layout = model_lp.detect(image)
    caption = generate_caption(image_path)

    result = {
        "file": os.path.basename(image_path),
        "layout_blocks": [b.type for b in layout],
        "caption": caption,
    }

    return result
