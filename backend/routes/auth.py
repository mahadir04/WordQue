"""Auth routes — register, login, profile management."""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
import jwt
import bcrypt
from database import get_db
from models import UserCreate, UserLogin, UserProfile, AuthResponse, GoogleLogin

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

SECRET_KEY = "wordque-secret-key-change-in-production-2024"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 72


def _create_token(user_id: str, email: str) -> str:
    """Create a JWT token."""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(authorization: str = Header(None)) -> dict:
    """Dependency: extract and validate JWT from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": payload["sub"], "email": payload["email"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


@router.post("/register", response_model=AuthResponse)
async def register(body: UserCreate):
    """Register a new user."""
    db = await get_db()
    try:
        # Check if email already exists
        cursor = await db.execute("SELECT id FROM users WHERE email = ?", (body.email.lower(),))
        existing = await cursor.fetchone()
        if existing:
            raise HTTPException(409, "Email already registered")

        user_id = str(uuid.uuid4())
        hashed_pw = _hash_password(body.password)

        # Generate avatar color from email hash
        colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"]
        color = colors[hash(body.email) % len(colors)]

        await db.execute(
            "INSERT INTO users (id, email, password, name, avatar_color) VALUES (?, ?, ?, ?, ?)",
            (user_id, body.email.lower(), hashed_pw, body.name, color),
        )
        await db.commit()

        token = _create_token(user_id, body.email.lower())

        return AuthResponse(
            token=token,
            user=UserProfile(
                id=user_id,
                email=body.email.lower(),
                name=body.name,
                avatar_color=color,
            ),
        )
    finally:
        await db.close()


@router.post("/login", response_model=AuthResponse)
async def login(body: UserLogin):
    """Log in with email and password."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, email, password, name, avatar_color FROM users WHERE email = ?",
            (body.email.lower(),),
        )
        user = await cursor.fetchone()

        if not user or not _verify_password(body.password, user["password"]):
            raise HTTPException(401, "Invalid email or password")

        token = _create_token(user["id"], user["email"])

        return AuthResponse(
            token=token,
            user=UserProfile(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                avatar_color=user["avatar_color"],
            ),
        )
    finally:
        await db.close()


import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@router.post("/google", response_model=AuthResponse)
async def google_login(body: GoogleLogin):
    """Log in or register with Google OAuth."""
    db = await get_db()
    try:
        # Verify the Google ID token
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not client_id:
            raise HTTPException(500, "Google OAuth is not configured on the server.")
        
        try:
            idinfo = id_token.verify_oauth2_token(
                body.id_token, google_requests.Request(), client_id
            )
        except ValueError:
            raise HTTPException(401, "Invalid Google ID token")

        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")
        
        if not email:
            raise HTTPException(400, "Email not provided by Google")

        email = email.lower()

        # Check if user already exists
        cursor = await db.execute(
            "SELECT id, email, password, name, avatar_color FROM users WHERE email = ?",
            (email,),
        )
        user = await cursor.fetchone()

        if user:
            # User exists, just log them in
            token = _create_token(user["id"], user["email"])
            return AuthResponse(
                token=token,
                user=UserProfile(
                    id=user["id"],
                    email=user["email"],
                    name=user["name"],
                    avatar_color=user["avatar_color"],
                ),
            )
        else:
            # User does not exist, register them
            user_id = str(uuid.uuid4())
            import secrets
            random_pw = secrets.token_urlsafe(32)
            hashed_pw = _hash_password(random_pw)

            # Generate avatar color
            colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"]
            color = colors[hash(email) % len(colors)]

            await db.execute(
                "INSERT INTO users (id, email, password, name, avatar_color) VALUES (?, ?, ?, ?, ?)",
                (user_id, email, hashed_pw, name, color),
            )
            await db.commit()

            token = _create_token(user_id, email)
            return AuthResponse(
                token=token,
                user=UserProfile(
                    id=user_id,
                    email=email,
                    name=name,
                    avatar_color=color,
                ),
            )
    finally:
        await db.close()


@router.get("/me", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, email, name, avatar_color FROM users WHERE id = ?",
            (current_user["id"],),
        )
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(404, "User not found")

        return UserProfile(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            avatar_color=user["avatar_color"],
        )
    finally:
        await db.close()


@router.put("/me", response_model=UserProfile)
async def update_profile(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's display name or avatar color."""
    db = await get_db()
    try:
        updates = []
        values = []
        if "name" in body:
            updates.append("name = ?")
            values.append(body["name"])
        if "avatar_color" in body:
            updates.append("avatar_color = ?")
            values.append(body["avatar_color"])

        if updates:
            values.append(current_user["id"])
            await db.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                values,
            )
            await db.commit()

        cursor = await db.execute(
            "SELECT id, email, name, avatar_color FROM users WHERE id = ?",
            (current_user["id"],),
        )
        user = await cursor.fetchone()

        return UserProfile(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            avatar_color=user["avatar_color"],
        )
    finally:
        await db.close()
