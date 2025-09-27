"""Authentication utilities and WorkOS integration."""
import os
from typing import Optional, Dict
from datetime import datetime, timedelta
import json
import base64
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Simplified auth for now - can be replaced with actual WorkOS integration
class AuthManager:
    """Simplified authentication manager."""
    
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
        self.sessions = {}  # In-memory session storage
    
    def create_session(self, user_id: str) -> str:
        """Create a session token for a user."""
        session_id = f"session_{user_id}_{datetime.now().timestamp()}"
        session_data = {
            "user_id": user_id,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(days=7)
        }
        self.sessions[session_id] = session_data
        
        # Create a simple token (in production, use proper JWT)
        token_data = {
            "session_id": session_id,
            "user_id": user_id
        }
        token = base64.b64encode(json.dumps(token_data).encode()).decode()
        return token
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify a session token."""
        try:
            token_data = json.loads(base64.b64decode(token).decode())
            session_id = token_data.get("session_id")
            
            if session_id in self.sessions:
                session = self.sessions[session_id]
                if session["expires_at"] > datetime.now():
                    return session
                else:
                    # Remove expired session
                    del self.sessions[session_id]
        except Exception:
            pass
        return None
    
    def simulate_workos_login(self, email: str, name: str) -> str:
        """Simulate WorkOS login - returns a mock WorkOS user ID."""
        # In production, this would handle actual WorkOS authentication
        return f"workos_user_{hash(email)}"
    
    def logout(self, token: str) -> bool:
        """Logout by invalidating the session."""
        try:
            token_data = json.loads(base64.b64decode(token).decode())
            session_id = token_data.get("session_id")
            if session_id in self.sessions:
                del self.sessions[session_id]
                return True
        except Exception:
            pass
        return False

# Global auth manager
auth_manager = AuthManager()
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current authenticated user."""
    if not credentials:
        return None
    
    session = auth_manager.verify_token(credentials.credentials)
    if session:
        from database import db
        return db.get_user_by_id(session["user_id"])
    return None

async def require_auth(current_user = Depends(get_current_user)):
    """Require authentication."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user

async def optional_auth(current_user = Depends(get_current_user)):
    """Optional authentication."""
    return current_user