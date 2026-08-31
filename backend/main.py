from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from models.trip import Trip
from models.user import User
from database import SessionLocal, init_db
from services.bedrock_service import get_ai_recommendation
from services.auth_service import register_user, login_user, create_token, decode_token
import jwt

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.1.48:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ─── Auth dependency ──────────────────────────────────────────────────────────

_bearer = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    """Decode the Bearer JWT and return the payload. Raises 401 on any failure."""
    try:
        payload = decode_token(credentials.credentials)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

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

class TripRequest(BaseModel):
        destination:    str
        days:           int
        budget:         float
        travel_style:   str


class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str
# FastAPI validates the JSON body against this model
# If a field is missing or wrong type, it returns 422 automatically

# Reuse yesterday's business logic - unchanged
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category
)

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

@app.get("/api/v1/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        user_id = int(current_user["sub"])
        user    = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"User {user_id} not found. Please re-register or contact support."
            )
        trip_count = db.query(Trip).filter(Trip.user_id == user.id).count()
        return {
            "id":          user.id,
            "name":        user.name,
            "email":       user.email,
            "created_at":  user.created_at,
            "total_trips": trip_count,
        }
    finally:
        db.close()


@app.post("/api/v1/auth/register", status_code=201)
def register(request: RegisterRequest):
    try:
        user = register_user(
            name     = request.name,
            email    = request.email,
            password = request.password,
        )
        return {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "created_at": user.created_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@app.post("/api/v1/auth/login")
def login(request: LoginRequest):
    try:
        user  = login_user(email=request.email, password=request.password)
        token = create_token(user)
        return {
            "access_token": token,
            "token_type":   "bearer",
            "user": {
                "id":    user.id,
                "name":  user.name,
                "email": user.email,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/api/v1/trips")
def create_trip(request: TripRequest, current_user: dict = Depends(get_current_user)):
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = get_trip_category(request.budget)

    ai_recommendation = get_ai_recommendation(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        travel_style = request.travel_style,
    )

    trip = Trip(
        user_id           = int(current_user["sub"]),
        destination       = request.destination,
        days              = request.days,
        budget            = request.budget,
        category          = category,
        daily_budget      = daily_budget,
        travel_style      = request.travel_style,
        ai_recommendation = ai_recommendation,
    )

    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)
    db.close()
    return trip


@app.get("/api/v1/trips")
def list_trips(current_user: dict = Depends(get_current_user)):
    db    = SessionLocal()
    trips = db.query(Trip).filter(Trip.user_id == int(current_user["sub"])).all()
    db.close()
    return trips


@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, current_user: dict = Depends(get_current_user)):
    db   = SessionLocal()
    trip = db.query(Trip).filter(
        Trip.id      == trip_id,
        Trip.user_id == int(current_user["sub"])
    ).first()
    db.close()
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


@app.put ("/api/v1/trips/{id}/generate")
def update_trip_with_AI_recommendations(id:int, budget:float, travel_style:str):
    db = SessionLocal()
    trip=db.query(Trip).filter(Trip.id == id).first()
    # handling if not found
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {id} not found")
    trip.budget = budget
    trip.daily_budget = calculate_daily_budget(budget,trip.days)
    trip.category = get_trip_category(budget)
    trip.ai_recommendation = get_ai_recommendation(
        destination = trip.destination,
        days=trip.days,
        budget=trip.budget,
        travel_style= travel_style,
    )
    db.commit()
    db.close()
    return (f"Trip with id {id} updated with AI recommendation successfully")    
