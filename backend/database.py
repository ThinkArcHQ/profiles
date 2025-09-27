"""Database configuration and models."""
import os
from typing import Optional
from datetime import datetime
import uuid

# For now, we'll use improved in-memory storage with persistence simulation
# This can be easily replaced with actual database later when dependencies are available

class DatabaseManager:
    """Simulated database manager that will be replaced with real database."""
    
    def __init__(self):
        # In-memory storage
        self.users = {}
        self.profiles = {}
        self.appointment_requests = {}
        
    def create_user(self, workos_user_id: str, email: str, name: str) -> dict:
        """Create a new user."""
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "workos_user_id": workos_user_id,
            "email": email,
            "name": name,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        self.users[user_id] = user
        return user
    
    def get_user_by_workos_id(self, workos_user_id: str) -> Optional[dict]:
        """Get user by WorkOS user ID."""
        for user in self.users.values():
            if user["workos_user_id"] == workos_user_id:
                return user
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID."""
        return self.users.get(user_id)
    
    def create_profile(self, user_id: str, profile_data: dict) -> dict:
        """Create a profile for a user. Only one profile per user is allowed."""
        # Check if user already has a profile
        existing_profiles = self.get_profiles_by_user_id(user_id)
        if existing_profiles:
            # Update existing profile instead of creating new one
            return self.update_profile(existing_profiles[0]["id"], profile_data)
        
        profile_id = str(uuid.uuid4())
        now = datetime.now()
        
        profile = {
            "id": profile_id,
            "user_id": user_id,
            "name": profile_data["name"],
            "email": profile_data["email"],
            "skills": profile_data["skills"],
            "bio": profile_data["bio"],
            "available_for": profile_data["available_for"],
            "created_at": now,
            "updated_at": now
        }
        self.profiles[profile_id] = profile
        return profile
    
    def update_profile(self, profile_id: str, profile_data: dict) -> dict:
        """Update an existing profile."""
        if profile_id not in self.profiles:
            raise ValueError("Profile not found")
        
        profile = self.profiles[profile_id]
        profile.update({
            "name": profile_data["name"],
            "email": profile_data["email"],
            "skills": profile_data["skills"],
            "bio": profile_data["bio"],
            "available_for": profile_data["available_for"],
            "updated_at": datetime.now()
        })
        
        return profile
    
    def get_profiles(self) -> list:
        """Get all profiles."""
        return list(self.profiles.values())
    
    def get_profile_by_id(self, profile_id: str) -> Optional[dict]:
        """Get profile by ID."""
        return self.profiles.get(profile_id)
    
    def get_profiles_by_user_id(self, user_id: str) -> list:
        """Get all profiles for a user."""
        return [p for p in self.profiles.values() if p["user_id"] == user_id]
    
    def create_appointment_request(self, request_data: dict, sender_user_id: Optional[str] = None) -> dict:
        """Create an appointment request."""
        request_id = str(uuid.uuid4())
        request = {
            "id": request_id,
            "profile_id": request_data["profile_id"],
            "requester_name": request_data["requester_name"],
            "requester_email": request_data["requester_email"],
            "message": request_data["message"],
            "preferred_time": request_data.get("preferred_time"),
            "request_type": request_data["request_type"],
            "status": "pending",
            "created_at": datetime.now(),
            "sender_user_id": sender_user_id
        }
        self.appointment_requests[request_id] = request
        return request
    
    def get_requests_for_profile(self, profile_id: str) -> list:
        """Get all requests for a profile."""
        return [r for r in self.appointment_requests.values() if r["profile_id"] == profile_id]
    
    def get_requests_by_user_id(self, user_id: str) -> list:
        """Get all requests for user's profiles."""
        user_profiles = self.get_profiles_by_user_id(user_id)
        profile_ids = [p["id"] for p in user_profiles]
        return [r for r in self.appointment_requests.values() if r["profile_id"] in profile_ids]
    
    def get_sent_requests_by_user_id(self, user_id: str) -> list:
        """Get all requests sent by a user."""
        return [r for r in self.appointment_requests.values() if r.get("sender_user_id") == user_id]
    
    def update_request_status(self, request_id: str, status: str) -> bool:
        """Update request status."""
        if request_id in self.appointment_requests:
            self.appointment_requests[request_id]["status"] = status
            return True
        return False

# Global database instance
db = DatabaseManager()