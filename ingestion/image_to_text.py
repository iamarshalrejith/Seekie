from google import genai
from PIL import Image
from typing import List, Dict
from multimodal_info import extract_images_from_pdf

import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

def images_to_text_gemini(image_docs: List[Dict]):
    client = genai.Client()

    PROMPT = """
    You are analyzing a medical figure from WHO clinical guidelines.

    Describe ONLY what is visible in the image.
    Do NOT diagnose.
    Do NOT speculate.
    Do NOT add external medical knowledge.

    Write a clear, factual description suitable for clinicians.
    """

    caption_docs = []

    for img in image_docs:
        img_path = img["image_path"]
        metadata = img["metadata"]

        try:
            image = Image.open(img_path)

            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=[PROMPT, image],
            )

            caption = response.text.strip()

            # Convert to RAG-ready document
            caption_docs.append({
                "text": caption,
                "metadata": {
                    **metadata,
                    "type": "image_caption"
                }
            })

        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    return caption_docs

img_docs = extract_images_from_pdf(r"C:\Users\ashwi\Amrith\RAG\arboviral_diseases.pdf")
captions = images_to_text_gemini(img_docs)
print("Generated Captions:\n", captions)