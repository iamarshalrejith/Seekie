from pinecone import Pinecone
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

# ── Pinecone setup ────────────────────────────────────────────────
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("medirag-dense-py")

# ── Groq LLM setup ───────────────────────────────────────────────
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile",  # or mixtral-8x7b-32768, gemma2-9b-it, etc.
    temperature=0.2
)

# ── Search Pinecone ───────────────────────────────────────────────
def retrieve(query: str, top_k: int = 5) -> list[dict]:
    results = index.search(
        namespace="example-namespace",
        query={
            "inputs": {"text": query},
            "top_k": top_k
        }
    )

    chunks = []
    for match in results["result"]["hits"]:
        chunks.append({
            "text":    match["fields"].get("text", ""),
            "source":  match["fields"].get("source", ""),
            "page":    match["fields"].get("page", ""),
            "section": match["fields"].get("section", ""),
            "score":   match["_score"]
        })

    return chunks

# ── Build context string ──────────────────────────────────────────
def build_context(chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        context_parts.append(
            f"[Chunk {i} | source: {chunk['source']} | page: {chunk['page']} | score: {chunk['score']:.3f}]\n"
            f"{chunk['text']}"
        )
    return "\n\n---\n\n".join(context_parts)

# ── RAG call ─────────────────────────────────────────────────────
def answer(query: str) -> str:
    chunks  = retrieve(query)
    context = build_context(chunks)

    messages = [
        SystemMessage(content=(
            "You are a medical RAG assistant. Answer the user's question using ONLY "
            "the provided context chunks. If the context doesn't contain enough information, "
            "say so clearly. Always mention which source/page your answer comes from."
        )),
        HumanMessage(content=(
            f"Context:\n{context}\n\n"
            f"Question: {query}"
        ))
    ]

    response = llm.invoke(messages)
    return response.content

# ── Main ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    query = input("Enter your search query: ")
    print("\n" + "="*60)
    print(answer(query))