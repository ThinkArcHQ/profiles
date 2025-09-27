from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(title="Profiles API", description="API for AI agent profile connections")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Profile(BaseModel):
    id: str
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

# In-memory storage (replace with database in production)
profiles_db = {}
appointment_requests_db = {}

@app.get("/")
async def root():
    return {"message": "Profiles API - Reimagining Connections in the Era of AI"}

@app.get("/profiles", response_model=List[Profile])
async def get_profiles():
    """Get all profiles"""
    return list(profiles_db.values())

@app.post("/profiles", response_model=Profile)
async def create_profile(profile: ProfileCreate):
    """Create a new profile"""
    profile_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_profile = Profile(
        id=profile_id,
        name=profile.name,
        email=profile.email,
        skills=profile.skills,
        bio=profile.bio,
        available_for=profile.available_for,
        created_at=now,
        updated_at=now
    )
    
    profiles_db[profile_id] = new_profile
    return new_profile

@app.get("/profiles/{profile_id}", response_model=Profile)
async def get_profile(profile_id: str):
    """Get a specific profile by ID"""
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profiles_db[profile_id]

@app.post("/appointments")
async def request_appointment(request: AppointmentRequest):
    """Request an appointment, quote, or meeting with a profile"""
    if request.profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    request_id = str(uuid.uuid4())
    appointment_requests_db[request_id] = {
        "id": request_id,
        "profile_id": request.profile_id,
        "requester_name": request.requester_name,
        "requester_email": request.requester_email,
        "message": request.message,
        "preferred_time": request.preferred_time,
        "request_type": request.request_type,
        "status": "pending",
        "created_at": datetime.now()
    }
    
    return {"message": "Request submitted successfully", "request_id": request_id}

@app.get("/search/profiles")
async def search_profiles(q: Optional[str] = None, skills: Optional[str] = None):
    """Search profiles by name, skills, or bio"""
    results = list(profiles_db.values())
    
    if q:
        q_lower = q.lower()
        results = [p for p in results if q_lower in p.name.lower() or q_lower in p.bio.lower()]
    
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",")]
        results = [p for p in results if any(skill in [s.lower() for s in p.skills] for skill in skill_list)]
    
    return results

# MCP endpoints for AI agents
@app.get("/mcp/profiles")
async def mcp_get_profiles():
    """MCP-compatible endpoint for AI agents to discover profiles"""
    profiles = list(profiles_db.values())
    return {
        "profiles": [
            {
                "id": p.id,
                "name": p.name,
                "skills": p.skills,
                "bio": p.bio,
                "available_for": p.available_for
            }
            for p in profiles
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)