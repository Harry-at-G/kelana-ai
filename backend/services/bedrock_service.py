import json
import os

import boto3
from dotenv import load_dotenv

load_dotenv()


def get_bedrock_client():
    """Create and return a configured AWS Bedrock Runtime client."""
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("AWS_REGION"),
    )


def chat_with_bedrock(history: list, user_message: str) -> str:
    """
    Send conversation history + new user message to Bedrock and return the reply.
    Used by the Chat page for free-form conversation.
    """
    client   = get_bedrock_client()
    model_id = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

    messages = [
        {"role": m["role"], "content": [{"text": m["content"]}]}
        for m in history
    ]
    messages.append({"role": "user", "content": [{"text": user_message}]})

    body = {
        "system": [{
            "text": (
                "You are KelanaAI, a friendly and knowledgeable travel assistant. "
                "Help users plan trips, answer travel questions, and provide destination advice."
            )
        }],
        "messages": messages,
        "inferenceConfig": {"maxTokens": 1024, "temperature": 0.7},
    }

    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    response_body = json.loads(response["body"].read())
    return response_body["output"]["message"]["content"][0]["text"]


def detect_trip_intent(message: str):
    """
    Use the LLM to determine if a message is requesting a trip plan.
    Returns a dict with destination, days, budget, travel_style if detected,
    or None if the message is not a trip planning request.
    """
    client   = get_bedrock_client()
    model_id = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

    prompt = (
        "You are a strict intent classifier. Analyze the user message below.\n\n"
        "Respond YES only if the user is EXPLICITLY asking to:\n"
        "- Create / plan / generate / build a travel itinerary\n"
        "- Get a day-by-day trip plan\n\n"
        "Do NOT respond YES for general travel questions, tips, advice, or recommendations "
        "that do not request a full itinerary.\n\n"
        "If YES, extract these fields and respond with ONLY a valid JSON object (no extra text):\n"
        '{"destination": "...", "days": <int>, "budget": <float>, "travel_style": "..."}\n\n'
        "Rules for defaults if not mentioned:\n"
        "- days: 3\n"
        "- budget: 1000\n"
        "- travel_style: one of Adventure, Backpacker, Business, Cultural, Family, Luxury, Relaxed — pick Cultural\n\n"
        "If NO, respond with exactly the word: null\n\n"
        f"User message: {message}"
    )

    body = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": 200, "temperature": 0.1},
    }

    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    raw = json.loads(response["body"].read())["output"]["message"]["content"][0]["text"].strip()

    # Strip markdown code fences the model sometimes wraps around JSON
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(
            line for line in lines
            if not line.strip().startswith("```")
        ).strip()

    if raw.lower() == "null" or not raw.startswith("{"):
        return None

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def get_ai_recommendation(
    destination: str,
    days: int,
    budget: float,
    travel_style: str,
) -> str:
    """
    Call AWS Bedrock to generate a travel itinerary recommendation.
    Used by the Plan a Trip page and trip planning intent in Chat.
    """
    client   = get_bedrock_client()
    model_id = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

    prompt = (
        f"You are an experienced travel planner.\n\n"
        f"Plan a {days}-day itinerary for {destination}.\n\n"
        f"Budget: USD {budget}\n\n"
        f"Travel Style: {travel_style}\n\n"
        "Create 2-3 activities for the morning. "
        "Include cultural sites and local activities for the afternoon. "
        "Recommend dinner spots and evening activities. "
        "Include estimated daily budget, local food recommendations and transportation suggestions. "
        "Format your response as Markdown with headers (##) and bullet lists (-)."
    )

    body = {
        "messages": [
            {"role": "user", "content": [{"text": prompt}]}
        ],
        "inferenceConfig": {
            "maxTokens": 2048,
            "temperature": 0.7,
        },
    }

    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )

    response_body = json.loads(response["body"].read())
    return response_body["output"]["message"]["content"][0]["text"]
