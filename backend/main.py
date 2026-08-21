from fastapi import FastAPI, HTTPException
from models.trip import Trip
from database import SessionLocal, init_db

app = FastAPI()

init_db()

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
#@app.post("/api/v1/trips")
#def create_trip(request: TripRequest):
#      daily_budget = calculate_daily_budget(
#        request.budget, request.days
#    )
#    category = get_trip_category(
#        request.budget
#    )
#
#    if category == "Backpacker":
#        recommended_transportation = "Bus"
#    elif category == "Standard":
#        recommended_transportation = "Train"
#    else: 
#        recommended_transportation = "Flight"
#    
#    return {
#        "destination" : request.destination,
#        "days" : request.days,
#        "budget" : request.budget,
#        "daily_budget" : daily_budget,
#        "category" : category,
#        "recommendation_transport" : recommended_transportation,
#    }

# a Get endpoint at the root path to get list of the categories
@app.get("/api/v1/trip-categories")
def list_categories():
    return{
        "Backpacker", "Standard", "Luxury"
    }

# a Get endpoint at the root path to get list of the recommendations
@app.get("/api/v1/recommendations")
def list_recommendations():
    return{
        "Tokyo Tower", "Mount Fuji", "Shibuya"
    }

# a Get endpoint at the root path to get list of list the transportations
@app.get("/api/v1/transportations")
def list_transportations():
    return{
        "Bus", "Train", "Flight"
    }

@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    # reuse Session 2 business logic
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = get_trip_category(request.budget)

    # create a Trip ORM object
    trip = Trip(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
    )

    # save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)   # get the auto-generated id
    db.close()
    return trip

@app.get("/api/v1/trips")
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
    # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip

@app.delete("/api/v1/trips/{id}")
def delete_trip(id:int):
    db= SessionLocal()
    trip = db.query(Trip).filter(Trip.id == id).first()
    # handling if not found
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {id} not found")
    db.delete(trip)
    db.commit()
    db.close()
    return (f"Trip with id {id} deleted successfully")    

@app.put ("/api/v1/trips/{id}")
def update_trip(id:int, budget:float):
    db = SessionLocal()
    trip=db.query(Trip).filter(Trip.id == id).first()
    # handling if not found
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {id} not found")
    trip.budget = budget
    trip.daily_budget = calculate_daily_budget(budget,trip.days)
    trip.category = get_trip_category(budget)
    db.commit()
    db.close()
    return (f"Trip with id {id} updated successfully")    
