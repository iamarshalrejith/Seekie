# Seekie

> **Ask questions across your documents. Get precise answers with source attribution.**

Seekie is a document-question-answering application built around **Retrieval-Augmented Generation (RAG)**. It lets users upload PDF documents, extracts their content, splits it into searchable chunks, indexes those chunks in **Pinecone**, and uses **Groq + Llama 3.3 70B** to generate answers grounded in the retrieved context.

The project also contains an optional multimodal ingestion path that extracts images from PDFs and can generate factual image descriptions using **Google Gemini**.

---

## ✨ Features

- 📄 **PDF upload** through a React web interface
- 🔎 **Natural-language document search**
- 🧠 **RAG-based answers** grounded only in retrieved document context
- 📚 **Source attribution** with document name, page number, and section
- 📊 **Similarity scores** for retrieved chunks
- ⚡ **Background ingestion** with progress polling
- 🗂️ **Pinecone vector search** using `llama-text-embed-v2`
- 🤖 **Groq LLM generation** using `llama-3.3-70b-versatile`
- 🖼️ **Optional image extraction and Gemini captioning**
- 🧹 **Clear indexed documents** from the Seekie namespace
- 🌙 Minimal dark UI with loading states and expandable source cards

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React + Vite    │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                    HTTP / REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    │       Backend        │
                    └───────┬───────┬──────┘
                            │       │
                  Ingestion│       │Query
                            │       │
                            ▼       ▼
                    ┌──────────┐  ┌──────────────┐
                    │  PyMuPDF │  │   Pinecone   │
                    │ PDF Text │  │ Vector Search│
                    └────┬─────┘  └──────┬───────┘
                         │                │
                         ▼                │
                 ┌──────────────┐         │
                 │ Text Chunking│         │
                 │ 700 / 120    │         │
                 └──────┬───────┘         │
                        │                 │
                        └──────► Pinecone │
                                         │
                                         ▼
                              ┌──────────────────┐
                              │   Groq / Llama   │
                              │   3.3 70B        │
                              └────────┬─────────┘
                                       │
                                       ▼
                              Grounded Answer +
                              Source Chunks
```

### Optional multimodal path

```text
PDF
 │
 ├── Text ───────────────► PyMuPDF ──► Chunk ──► Pinecone
 │
 └── Images ─────────────► Gemini ──► Captions ─► Pinecone
```

---

## 🛠️ Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS 4
- React Icons
- JavaScript / JSX

### Backend

- Python
- FastAPI
- Uvicorn
- PyMuPDF
- LangChain
- LangChain Text Splitters
- Pydantic

### AI / RAG

- **Pinecone** — vector database and hosted embedding/search
- **`llama-text-embed-v2`** — Pinecone integrated embedding model
- **Groq** — LLM inference
- **`llama-3.3-70b-versatile`** — answer generation
- **Google Gemini** — optional image-to-text generation

---

## 📁 Project Structure

```text
Seekie/
│
├── frontend/
│   ├── public/
│   │   └── bot.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── SearchInput.jsx
│   │   ├── pages/
│   │   │   └── SearchPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── ingestion/
│   ├── main.py
│   ├── load.py
│   ├── chunk_embed.py
│   ├── merge_text.py
│   ├── multimodal_info.py
│   ├── image_to_text.py
│   ├── search_query.py
│   └── requirements.txt
│
├── requirements.txt
├── .gitignore
└── LICENSE
```

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/iamarshalrejith/Seekie.git
cd Seekie
```

---

## 2. Set up the backend

Create a Python virtual environment:

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Configure environment variables

Create a `.env` file in the project root:

```env
PINECONE_API_KEY=your_pinecone_api_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Required keys

| Variable | Used for | Required |
|---|---|---|
| `PINECONE_API_KEY` | Vector storage and retrieval | Yes |
| `GROQ_API_KEY` | LLM answer generation | Yes |
| `GEMINI_API_KEY` | Optional PDF image captioning | Only for multimodal ingestion |

**Never commit `.env` or API keys to Git.**

---

## 4. Start the backend

The FastAPI application is located at:

```text
ingestion/main.py
```

From the `ingestion` directory:

```bash
cd ingestion
uvicorn main:app --reload --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI's interactive documentation is available at:

```text
http://localhost:8000/docs
```

---

## 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local frontend URL, normally:

```text
http://localhost:5173
```

The frontend defaults to:

```text
http://localhost:8000
```

for the backend API.

To use a different backend URL, create:

```text
frontend/.env
```

with:

```env
VITE_API_URL=http://localhost:8000
```

Then restart the Vite development server.

---

# 🔄 How Seekie Works

## 1. Upload

The user selects a PDF from the frontend.

The frontend sends:

```http
POST /ingest
```

with the PDF as multipart form data.

The backend creates a unique `job_id` and starts ingestion in a background thread.

---

## 2. Extract text

PyMuPDF reads the PDF page by page.

For every page, Seekie stores:

- extracted text
- source filename
- document ID
- page number
- section
- content type

---

## 3. Optional image processing

When image captioning is enabled:

1. Images are extracted from the PDF.
2. Duplicate images are removed.
3. Very small images are filtered out.
4. CMYK images are converted to RGB.
5. Gemini generates a factual description of each image.
6. The description is converted into a RAG document.

The image prompt explicitly instructs the model to describe only what is visible and avoid diagnosis, speculation, or external medical knowledge.

---

## 4. Chunking

Documents are split using LangChain's `RecursiveCharacterTextSplitter`.

Current configuration:

```text
Chunk size:    700 characters
Overlap:       120 characters
```

The overlap helps preserve context between neighboring chunks.

---

## 5. Indexing

Chunks are stored in Pinecone under:

```text
Index:     seekie-rag
Namespace: seekie-namespace
```

Pinecone's integrated:

```text
llama-text-embed-v2
```

embedding model is used for semantic retrieval.

Records contain fields such as:

```text
_id
text
doc_id
page
section
source
type
```

---

## 6. Retrieval

When a user asks a question, the frontend sends:

```http
POST /query
```

Example:

```json
{
  "query": "What are the symptoms described in the document?",
  "top_k": 5
}
```

Pinecone retrieves the most relevant chunks.

The default is:

```text
top_k = 5
```

---

## 7. Answer generation

The retrieved chunks are combined into a context string and passed to Groq.

The LLM is configured with:

```text
Model:       llama-3.3-70b-versatile
Temperature: 0.2
```

The system prompt instructs the model to:

- use only the retrieved context
- clearly state when the context is insufficient
- mention the source and page

The API returns both the generated answer and the retrieved source chunks.

---

# 🔌 API Reference

## Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "service": "MediRAG API"
}
```

---

## Upload / Ingest PDF

```http
POST /ingest
```

### Form data

```text
file=<PDF>
use_image_captions=false
```

### Example response

```json
{
  "job_id": "generated-uuid",
  "message": "Ingestion started."
}
```

The endpoint returns HTTP `202 Accepted`.

---

## Check Ingestion Status

```http
GET /ingest/status/{job_id}
```

Example:

```json
{
  "job_id": "generated-uuid",
  "status": "running",
  "message": "Upserted 150/300 chunks...",
  "total": 300,
  "processed": 150,
  "error": null
}
```

Possible statuses:

```text
pending
running
done
failed
```

---

## Query Documents

```http
POST /query
```

Request:

```json
{
  "query": "What does the document say about treatment?",
  "top_k": 5
}
```

Response:

```json
{
  "answer": "According to the document...",
  "chunks": [
    {
      "text": "Relevant document content...",
      "source": "document.pdf",
      "page": 12,
      "section": "Treatment",
      "score": 0.91
    }
  ]
}
```

---

## Clear Index

```http
DELETE /clear
```

Deletes all vectors from:

```text
seekie-namespace
```

Use this carefully because it removes the indexed data in that namespace.

---

# 🖥️ Frontend

The UI provides:

### Search

Users can type a natural-language question and press **Ask →** or Enter.

### Upload

PDFs can be:

- selected using the file picker
- dragged and dropped

### Ingestion progress

The frontend polls:

```text
/ingest/status/{job_id}
```

every 1.5 seconds and displays the current ingestion progress.

### Results

Each answer is displayed with:

- generated response
- source documents
- page numbers
- sections
- similarity scores
- expandable chunk content

---

# 🧪 Example Workflow

Start both servers:

```bash
# Terminal 1
cd ingestion
uvicorn main:app --reload --port 8000
```

```bash
# Terminal 2
cd frontend
npm run dev
```

Then:

1. Open the frontend.
2. Upload a PDF.
3. Click **Index Document →**.
4. Wait until ingestion completes.
5. Ask a question about the document.
6. Review the generated answer.
7. Expand the source chunks to inspect the retrieved context.

---

# 🧠 RAG Prompting Strategy

Seekie uses a grounded generation approach.

The model receives:

```text
Context:
[Chunk 1 | source | page | score]
...

[Chunk 2 | source | page | score]
...

Question:
<user question>
```

The model is instructed not to rely on information outside the supplied context.

This reduces unsupported answers and makes the retrieved source material visible to the user.

---

# ⚠️ Current Limitations

- The ingestion job store is **in-memory**, so job status is lost when the backend restarts.
- Uploaded files are stored temporarily and removed after ingestion.
- CORS is currently configured with `allow_origins=["*"]`; production deployments should restrict this.
- There is currently no authentication or authorization layer.
- The application is primarily designed around PDF documents.
- The frontend currently uploads with the default `use_image_captions=false`; the multimodal path exists in the backend but is not exposed as a frontend toggle.
- The repository contains some earlier standalone ingestion/search scripts (`chunk_embed.py`, `search_query.py`, `merge_text.py`) that use older Pinecone index/namespace names. The current FastAPI application uses:
  - `seekie-rag`
  - `seekie-namespace`
- Pinecone, Groq, and optionally Gemini require valid API credentials.
- The system should not be treated as a substitute for professional medical advice, even when medical documents are indexed.

---

# 🔐 Security Considerations

Before deploying Seekie publicly:

- Restrict CORS origins.
- Add authentication.
- Validate uploaded file size and MIME type.
- Add rate limiting.
- Avoid returning raw internal exceptions to clients.
- Store ingestion jobs in a persistent database/queue.
- Add logging and monitoring.
- Keep API keys in environment variables or a secret manager.
- Add access controls if documents may contain sensitive information.
- Consider document-level authorization so users cannot retrieve another user's documents.

---

# 🛣️ Future Improvements

Potential improvements include:

- [ ] User authentication
- [ ] Multi-user document collections
- [ ] Persistent ingestion job tracking
- [ ] Streaming LLM responses
- [ ] Citation links directly to PDF pages
- [ ] Document management and deletion
- [ ] Folder / workspace support
- [ ] Better section-aware chunking
- [ ] Hybrid keyword + semantic search
- [ ] Reranking retrieved chunks
- [ ] Conversation history
- [ ] Frontend image-captioning toggle
- [ ] Support for DOCX, TXT, and other document formats
- [ ] Dockerized deployment
- [ ] Production logging and monitoring
- [ ] Automated evaluation of retrieval and answer quality

---

# 📜 License

This project is distributed under the license included in the repository's [`LICENSE`](LICENSE) file.

---

## 💡 Project Summary

**Seekie = Upload → Extract → Chunk → Embed → Retrieve → Generate → Cite**

It combines a modern React interface with a FastAPI RAG backend, Pinecone semantic retrieval, and LLM-powered grounded generation to turn static PDF documents into an interactive question-answering system.
