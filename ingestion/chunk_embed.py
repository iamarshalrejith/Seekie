from merge_text import all_docs
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

index_name = "medirag-dense-py"

if not pc.has_index(index_name):
    pc.create_index_for_model(
        name=index_name,
        cloud="aws",
        region="us-east-1",
        embed={
            "model": "llama-text-embed-v2",
            "field_map": {"text": "text"}
        }
    )

index = pc.Index(index_name)

# Chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=120
)

chunked_docs = []

for doc in all_docs:
    chunks = text_splitter.split_text(doc["text"])
    for chunk in chunks:
        chunked_docs.append({
            "text": chunk,
            "metadata": doc["metadata"]
        })

# Prepare records — flat structure, no nested "metadata" key
records = []

for doc in chunked_docs:
    metadata = doc["metadata"]
    records.append({
        "_id": str(uuid.uuid4()),   # note: _id, not id
        "text": doc["text"],        # this gets embedded via field_map
        # flat metadata fields
        "doc_id":  str(metadata.get("doc_id", "")),
        "page":    int(metadata.get("page", 0)),
        "section": str(metadata.get("section", "")),
        "source":  str(metadata.get("source", "")),
        "type":    str(metadata.get("type", "")),
    })

# Batch upsert using upsert_records
batch_size = 50

for i in range(0, len(records), batch_size):
    batch = records[i:i + batch_size]
    index.upsert_records(namespace="example-namespace", records=batch)   # ✅ fixed
    print(f"Upserted batch {i // batch_size + 1} with {len(batch)} chunks.")

print(f"Upserted {len(records)} chunks successfully.")