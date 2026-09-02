import os
import json
import boto3
from dotenv import load_dotenv

load_dotenv()

_region            = os.getenv("AWS_REGION", "ap-southeast-2")
_KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "")
_MODEL_ID          = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

_retrieval_client = boto3.client("bedrock-agent-runtime", region_name=_region)
_runtime_client   = boto3.client("bedrock-runtime",       region_name=_region)


def ask_knowledge_base(question: str) -> dict:
    """
    Two-step RAG against a MANAGED Bedrock Knowledge Base.

    Returns:
        dict with keys:
            answer  (str)  — AI-generated grounded answer
            sources (list) — list of {"title": str, "uri": str, "score": float}
    """
    # Step 1 — retrieve relevant passages
    retrieval_response = _retrieval_client.retrieve(
        knowledgeBaseId=_KNOWLEDGE_BASE_ID,
        retrievalQuery={"text": question},
        retrievalConfiguration={
            "managedSearchConfiguration": {"numberOfResults": 1},
        },
    )

    results  = retrieval_response.get("retrievalResults", [])
    passages = []
    sources  = []

    for r in results:
        text = r.get("content", {}).get("text", "")
        if not text:
            continue
        passages.append(text)

        meta  = r.get("metadata", {})
        title = meta.get("_document_title", "")
        uri   = (
            r.get("location", {})
             .get("s3Location", {})
             .get("uri", "")
        )
        score = r.get("score", 0.0)
        if title or uri:
            sources.append({"title": title, "uri": uri, "score": round(score, 3)})

    context = "\n\n---\n\n".join(passages) if passages else "No relevant context found."

    # Step 2 — generate grounded answer
    prompt = (
        "You are a helpful travel assistant for KelanaAI.\n"
        "Use ONLY the context below to answer the question. "
        "If the context does not contain the answer, say so honestly.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Answer:"
    )

    body = {
        "messages": [
            {"role": "user", "content": [{"text": prompt}]}
        ],
        "inferenceConfig": {"maxTokens": 1024, "temperature": 0.2},
    }

    runtime_response = _runtime_client.invoke_model(
        modelId=_MODEL_ID,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )

    response_body = json.loads(runtime_response["body"].read())
    answer = response_body["output"]["message"]["content"][0]["text"]

    return {"answer": answer, "sources": sources}
