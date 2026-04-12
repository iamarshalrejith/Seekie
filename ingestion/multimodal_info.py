import os
import pymupdf
from typing import List, Dict

def extract_images_from_pdf(file_path: str) -> List[Dict]:
    image_docs = []

    try:
        pdf_name = os.path.basename(file_path)
        doc_id = pdf_name.replace(".pdf", "").lower().replace(" ", "_")

        image_dir = f"data/images/{doc_id}"
        os.makedirs(image_dir, exist_ok=True)

        doc = pymupdf.open(file_path)

        seen_xrefs = set()  # for deduplication

        for page_index in range(len(doc)):
            page = doc[page_index]
            image_list = page.get_images(full=True)

            for image_index, img in enumerate(image_list, start=1):
                xref = img[0]

                # Deduplicate
                if xref in seen_xrefs:
                    continue
                seen_xrefs.add(xref)

                pix = pymupdf.Pixmap(doc, xref)

                # Skip tiny images (noise filtering)
                if pix.width < 100 or pix.height < 100:
                    continue

                # Convert CMYK → RGB
                if pix.n - pix.alpha > 3:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)

                img_path = f"{image_dir}/page_{page_index+1}_img_{image_index}.png"
                pix.save(img_path)
                pix = None

                # Structured output (IMPORTANT)
                image_docs.append({
                    "image_path": img_path,
                    "metadata": {
                        "source": pdf_name,
                        "doc_id": doc_id,
                        "page": page_index + 1,
                        "image_index": image_index,
                        "type": "image"
                    }
                })

        doc.close()

    except Exception as e:
        print(f"Error extracting images from {file_path}: {e}")

    return image_docs

img_docs = extract_images_from_pdf(r"C:\Users\ashwi\Amrith\RAG\arboviral_diseases.pdf")
#print("Extracted image documents:\n", img_docs)