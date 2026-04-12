import pymupdf
import os

def load_pdf(file_path: str):
    documents = []

    try:
        pdf_name = os.path.basename(file_path)
        doc_id = pdf_name.replace(".pdf", "").lower().replace(" ", "_")

        with pymupdf.open(file_path) as doc:
            toc = doc.get_toc()

            # Optional: map page → section
            section_map = {}
            for level, title, page_num in toc:
                section_map[page_num] = title

            for page in doc:
                page_number = page.number + 1
                text = page.get_text("text").strip()

                if not text:
                    continue

                documents.append({
                    "text": text,
                    "metadata": {
                        "source": pdf_name,
                        "doc_id": doc_id,
                        "page": page_number,
                        "section": section_map.get(page_number, "Unknown"),
                        "type": "text"
                    }
                })
        print(f"Loaded {len(documents)} pages from {pdf_name}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

    return documents

#loaded_docs = load_pdf(r"C:\Users\ashwi\Amrith\RAG\arboviral_diseases.pdf")
#print("Documents are:\n", loaded_docs)