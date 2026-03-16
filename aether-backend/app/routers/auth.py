from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..services.auth_service import AuthService
from ..models import User, Organization
from sqlalchemy import select

router = APIRouter()

@router.post("/register")
async def register(email: str, password: str, org_name: str, db: AsyncSession = Depends(get_db)):
    # Create Org
    org = Organization(name=org_name)
    db.add(org)
    await db.flush()
    
    # Create User
    hashed_pwd = AuthService.get_password_hash(password)
    user = User(org_id=org.id, email=email, hashed_password=hashed_pwd, role="admin")
    db.add(user)
    await db.commit()
    
    return {"status": "success", "user_id": str(user.id), "org_id": str(org.id)}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not AuthService.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
