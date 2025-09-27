from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os

# Simple environment variable loading without dotenv
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

from database import db
from auth import auth_manager, get_current_user, require_auth, optional_auth

app = FastAPI(title="Profiles by FinderBee", description="Professional networking platform with AI agent integration")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class User(BaseModel):
    id: str
    workos_user_id: str
    email: str
    name: str
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    email: str
    name: str

class LoginRequest(BaseModel):
    email: str
    name: str

class LoginResponse(BaseModel):
    token: str
    user: User

class Profile(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    skills: List[str]
    bio: str
    available_for: List[str]  # ["appointments", "quotes", "meetings"]
    created_at: datetime
    updated_at: datetime

class ProfileCreate(BaseModel):
    name: str
    email: str
    skills: List[str]
    bio: str
    available_for: List[str]

class AppointmentRequest(BaseModel):
    profile_id: str
    requester_name: str
    requester_email: str
    message: str
    preferred_time: Optional[str] = None
    request_type: str  # "appointment", "quote", "meeting"

class AppointmentRequestResponse(BaseModel):
    id: str
    profile_id: str
    requester_name: str
    requester_email: str
    message: str
    preferred_time: Optional[str]
    request_type: str
    status: str
    created_at: datetime

class UpdateRequestStatus(BaseModel):
    status: str  # "accepted", "rejected"

# Authentication endpoints
@app.post("/auth/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """Simulate WorkOS login."""
    # Simulate WorkOS authentication
    workos_user_id = auth_manager.simulate_workos_login(login_request.email, login_request.name)
    
    # Check if user exists
    user = db.get_user_by_workos_id(workos_user_id)
    if not user:
        # Create new user
        user = db.create_user(workos_user_id, login_request.email, login_request.name)
    
    # Create session token
    token = auth_manager.create_session(user["id"])
    
    return LoginResponse(
        token=token,
        user=User(**user)
    )

@app.post("/auth/logout")
async def logout(current_user = Depends(require_auth)):
    """Logout current user."""
    # Token invalidation is handled by the auth manager
    return {"message": "Logged out successfully"}

@app.get("/auth/me", response_model=User)
async def get_current_user_info(current_user = Depends(require_auth)):
    """Get current user information."""
    return User(**current_user)

@app.get("/")
async def root():
    return {"message": "Profiles by FinderBee - Reimagining Connections in the Era of AI"}

@app.get("/profiles", response_model=List[Profile])
async def get_profiles():
    """Get all profiles."""
    profiles = db.get_profiles()
    return [Profile(**profile) for profile in profiles]

@app.post("/profiles", response_model=Profile)
async def create_profile(profile: ProfileCreate, current_user = Depends(require_auth)):
    """Create a new profile."""
    profile_data = profile.model_dump()
    new_profile = db.create_profile(current_user["id"], profile_data)
    return Profile(**new_profile)

@app.get("/profiles/my", response_model=List[Profile])
async def get_my_profiles(current_user = Depends(require_auth)):
    """Get current user's profiles."""
    profiles = db.get_profiles_by_user_id(current_user["id"])
    return [Profile(**profile) for profile in profiles]

@app.get("/profiles/{profile_id}", response_model=Profile)
async def get_profile(profile_id: str):
    """Get a specific profile by ID."""
    profile = db.get_profile_by_id(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return Profile(**profile)

@app.post("/appointments")
async def request_appointment(request: AppointmentRequest):
    """Request an appointment, quote, or meeting with a profile."""
    profile = db.get_profile_by_id(request.profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    request_data = request.model_dump()
    new_request = db.create_appointment_request(request_data)
    
    return {"message": "Request submitted successfully", "request_id": new_request["id"]}

@app.get("/appointments/received", response_model=List[AppointmentRequestResponse])
async def get_received_appointments(current_user = Depends(require_auth)):
    """Get appointment requests received by current user."""
    requests = db.get_requests_by_user_id(current_user["id"])
    return [AppointmentRequestResponse(**req) for req in requests]

@app.put("/appointments/{request_id}/status")
async def update_appointment_status(
    request_id: str, 
    status_update: UpdateRequestStatus,
    current_user = Depends(require_auth)
):
    """Update the status of an appointment request."""
    # Verify the request belongs to the current user's profiles
    user_requests = db.get_requests_by_user_id(current_user["id"])
    request_ids = [req["id"] for req in user_requests]
    
    if request_id not in request_ids:
        raise HTTPException(status_code=404, detail="Request not found or not authorized")
    
    success = db.update_request_status(request_id, status_update.status)
    if not success:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"message": f"Request {status_update.status} successfully"}

@app.get("/search/profiles")
async def search_profiles(q: Optional[str] = None, skills: Optional[str] = None):
    """Search profiles by name, skills, or bio."""
    results = db.get_profiles()
    
    if q:
        q_lower = q.lower()
        results = [p for p in results if q_lower in p["name"].lower() or q_lower in p["bio"].lower()]
    
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",")]
        results = [p for p in results if any(skill in [s.lower() for s in p["skills"]] for skill in skill_list)]
    
    return [Profile(**profile) for profile in results]

# MCP endpoints for AI agents
@app.get("/mcp/profiles")
async def mcp_get_profiles():
    """MCP-compatible endpoint for AI agents to discover profiles."""
    profiles = db.get_profiles()
    return {
        "profiles": [
            {
                "id": p["id"],
                "name": p["name"],
                "skills": p["skills"],
                "bio": p["bio"],
                "available_for": p["available_for"]
            }
            for p in profiles
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)