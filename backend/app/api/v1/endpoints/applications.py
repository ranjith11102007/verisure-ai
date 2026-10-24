from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_applications():
    return {"applications": [], "total": 0}


@router.post("/")
async def create_application():
    return {"message": "Application creation endpoint"}
