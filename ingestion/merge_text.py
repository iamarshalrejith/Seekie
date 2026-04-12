from load import load_pdf
from multimodal_info import extract_images_from_pdf
from image_to_text import images_to_text_gemini

file_path = r"C:\Users\ashwi\Amrith\RAG\arboviral_diseases.pdf"

# 1. Extract text
text_docs = load_pdf(file_path)

# 2. Extract images
image_docs = extract_images_from_pdf(file_path)

# 3. Convert images → captions
#caption_docs = images_to_text_gemini(image_docs)

# 4. Merge (IMPORTANT STEP)
all_docs = text_docs

