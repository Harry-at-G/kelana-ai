import json
import os

import boto3
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()


def get_bedrock_client():
    """Create and return a configured AWS Bedrock Runtime client."""
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("AWS_REGION"),
        # boto3 picks up AWS_BEARER_TOKEN_BEDROCK automatically for
        # Bedrock API key authentication.
    )


def get_ai_recommendation(
    destination: str,
    days: int,
    budget: float,
    travel_style: str,
) -> str:
    """
    Call AWS Bedrock to generate a travel itinerary recommendation.

    Args:
        destination: The travel destination.
        days: Number of days for the trip.
        budget: Total budget in USD.
        travel_style: Preferred travel style (e.g. adventure, relaxed, cultural).

    Returns:
        The AI-generated itinerary as a string.
    """
    client = get_bedrock_client()
    model_id = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

    prompt = (
        f"You are an experienced travel planner.\n\n"
        f"Plan a {days}-day itinerary for {destination}.\n\n"
        f"Budget: USD {budget}\n\n"
        f"Travel Style: {travel_style}"
        f"Include local food recommendations and transportation suggestions into the itinerary."
        f"Format your response as Markdown with headers (##) and bullet lists (-)."
    )

    body = {
        "messages": [
            {
                "role": "user",
                "content": [{"text": prompt}],
            }
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
