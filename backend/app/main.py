from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai import router as ai_router
from app.api.cam import router as cam_router
from app.api.cases import router as cases_router
from app.api.documents import router as documents_router
from app.api.extraction import router as extraction_router
from app.api.recommendation import router as recommendation_router
from app.api.research import router as research_router

app = FastAPI(title="Intelli-Credit API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(cases_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(extraction_router, prefix="/api")
app.include_router(research_router, prefix="/api")
app.include_router(recommendation_router, prefix="/api")
app.include_router(cam_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
