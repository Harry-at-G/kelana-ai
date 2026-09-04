from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from models.trip import Trip
from models.user import User
from models.conversation import Conversation, Message
from database import SessionLocal, init_db
from services.bedrock_service import get_ai_recommendation, detect_trip_intent, chat_with_bedrock
from services.auth_service import register_user, login_user, create_token, decode_token
from services.kb_service import ask_knowledge_base

import jwt

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://kelana-ai-theta.vercel.app",
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


class QuestionRequest(BaseModel):
    question: str


class ConversationRequest(BaseModel):
    title: str


class ConversationRenameRequest(BaseModel):
    title: str


class MessageRequest(BaseModel):
    content: str
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
def delete_trip(id: int, current_user: dict = Depends(get_current_user)):
    db   = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {id} not found")
    if trip.user_id != int(current_user["sub"]):
        db.close()
        raise HTTPException(status_code=403, detail="Forbidden: you do not own this trip")
    db.delete(trip)
    db.commit()
    db.close()
    return {"message": f"Trip with id {id} deleted successfully"}

@app.put("/api/v1/trips/{id}")
def update_trip(id: int, budget: float, current_user: dict = Depends(get_current_user)):
    db   = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {id} not found")
    if trip.user_id != int(current_user["sub"]):
        db.close()
        raise HTTPException(status_code=403, detail="Forbidden: you do not own this trip")
    trip.budget       = budget
    trip.daily_budget = calculate_daily_budget(budget, trip.days)
    trip.category     = get_trip_category(budget)
    db.commit()
    db.close()
    return {"message": f"Trip with id {id} updated successfully"}


@app.put("/api/v1/trips/{id}/generate")
def update_trip_with_AI_recommendations(
    id: int, budget: float, travel_style: str,
    current_user: dict = Depends(get_current_user)
):
    db   = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {id} not found")
    if trip.user_id != int(current_user["sub"]):
        db.close()
        raise HTTPException(status_code=403, detail="Forbidden: you do not own this trip")
    trip.budget       = budget
    trip.daily_budget = calculate_daily_budget(budget, trip.days)
    trip.category     = get_trip_category(budget)
    trip.ai_recommendation = get_ai_recommendation(
        destination  = trip.destination,
        days         = trip.days,
        budget       = trip.budget,
        travel_style = travel_style,
    )
    db.commit()
    db.close()
    return {"message": f"Trip with id {id} updated with AI recommendation successfully"}

@app.post("/api/v1/conversations", status_code=201)
def create_conversation(
    request: ConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation (topic) for the authenticated user."""
    db = SessionLocal()
    try:
        conv = Conversation(
            user_id = int(current_user["sub"]),
            title   = request.title.strip(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return {
            "id":         conv.id,
            "title":      conv.title,
            "created_at": conv.created_at,
            "messages":   [],
        }
    finally:
        db.close()


@app.get("/api/v1/conversations")
def list_conversations(current_user: dict = Depends(get_current_user)):
    """List all conversations for the authenticated user, newest first."""
    db = SessionLocal()
    try:
        convs = (
            db.query(Conversation)
            .filter(Conversation.user_id == int(current_user["sub"]))
            .order_by(Conversation.created_at.desc())
            .all()
        )
        return [
            {"id": c.id, "title": c.title, "created_at": c.created_at}
            for c in convs
        ]
    finally:
        db.close()


@app.patch("/api/v1/conversations/{conv_id}")
def rename_conversation(
    conv_id: int,
    request: ConversationRenameRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rename a conversation title."""
    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(
            Conversation.id      == conv_id,
            Conversation.user_id == int(current_user["sub"]),
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conv.title = request.title.strip()
        db.commit()
        db.refresh(conv)
        return {"id": conv.id, "title": conv.title, "created_at": conv.created_at}
    finally:
        db.close()


@app.get("/api/v1/conversations/{conv_id}")
def get_conversation(conv_id: int, current_user: dict = Depends(get_current_user)):
    """Get a conversation with all its messages."""
    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(
            Conversation.id      == conv_id,
            Conversation.user_id == int(current_user["sub"]),
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {
            "id":         conv.id,
            "title":      conv.title,
            "created_at": conv.created_at,
            "messages": [
                {"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at}
                for m in conv.messages
            ],
        }
    finally:
        db.close()


@app.post("/api/v1/conversations/{conv_id}/messages", status_code=201)
def send_message(
    conv_id: int,
    request: MessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Append a user message to the conversation, call AI for a reply,
    persist both, and return the assistant message.
    """
    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(
            Conversation.id      == conv_id,
            Conversation.user_id == int(current_user["sub"]),
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Persist user message
        user_msg = Message(
            conversation_id = conv_id,
            role            = "user",
            content         = request.content,
        )
        db.add(user_msg)
        db.flush()

        # Build history for context (last 10 messages, excluding the message just added)
        history = [
            {"role": m.role, "content": m.content}
            for m in conv.messages[:-1][-10:]
        ]

        # Detect if the user wants a trip plan
        trip_intent = detect_trip_intent(request.content)
        trip_plan   = None

        if trip_intent:
            # Generate full itinerary via Bedrock
            itinerary = get_ai_recommendation(
                destination  = trip_intent.get("destination", ""),
                days         = int(trip_intent.get("days", 3)),
                budget       = float(trip_intent.get("budget", 1000)),
                travel_style = trip_intent.get("travel_style", "Cultural"),
            )
            ai_response = itinerary
            trip_plan   = {
                "destination":  trip_intent.get("destination", ""),
                "days":         int(trip_intent.get("days", 3)),
                "budget":       float(trip_intent.get("budget", 1000)),
                "travel_style": trip_intent.get("travel_style", "Cultural"),
                "itinerary":    itinerary,
            }
        else:
            # General conversation — talk directly with Bedrock
            ai_response = chat_with_bedrock(history, request.content)

        # Persist assistant message
        assistant_msg = Message(
            conversation_id = conv_id,
            role            = "assistant",
            content         = ai_response,
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        response_data = {
            "id":         assistant_msg.id,
            "role":       assistant_msg.role,
            "content":    assistant_msg.content,
            "created_at": assistant_msg.created_at,
            "sources":    [],
        }
        if trip_plan:
            response_data["trip_plan"] = trip_plan

        return response_data
    finally:
        db.close()


@app.post("/api/v1/ask")
def ask_endpoint(request: QuestionRequest):
    result = ask_knowledge_base(request.question)
    return {
        "question": request.question,
        "answer":   result["answer"],
        "sources":  result["sources"],
    }

