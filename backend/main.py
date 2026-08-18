from fastapi import FastAPI

app = FastAPI()

# a Get endpoint at the root path
@app.get("/")
def home():
    return{
        "message"   : "Welcome to KelanaAI"
    }

# a Get endpoint at the root path
@app.get("/health")
def home():
    return{
        "status"   : "OK"
    }

from pydantic import BaseModel

class TripRequest(BaseModel):
        destination:    str
        days:           int
        budget:         float
        travel_style:   str
# FastAPI validates the JSON body against this model
# If a field is missing or wrong type, it returns 422 automatically

# Reuse yesterday's business logic - unchanged
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category
)

# POST endpoint - receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )

    if category == "Backpacker":
        recommended_transportation = "Bus"
    elif category == "Standard":
        recommended_transportation = "Train"
    else: 
        recommended_transportation = "Flight"
    
    return {
        "destination" : request.destination,
        "days" : request.days,
        "budget" : request.budget,
        "daily_budget" : daily_budget,
        "category" : category,
        "recommendation_transport" : recommended_transportation,
    }

# a Get endpoint at the root path to list the categories
@app.get("/api/v1/trip-categories")
def list_categories():
    return{
        "Backpacker", "Standard", "Luxury"
    }

# a Get endpoint at the root path to list the recommendations
@app.get("/api/v1/recommendations")
def list_recommendations():
    return{
        "Tokyo Tower", "Mount Fuji", "Shibuya"
    }

# a Get endpoint at the root path to list the transportations
@app.get("/api/v1/transportations")
def list_transportations():
    return{
        "Bus", "Train", "Flight"
    }
