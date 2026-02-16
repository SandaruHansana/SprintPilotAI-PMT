from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .resources import RES
from .fr01 import fr01_router
from .fr02 import fr02_router
from .fr03 import fr03_router
from .fr04 import fr04_router
from .fr05 import fr05_router

app = FastAPI(title="SprintPilotAI API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    # Load spaCy + FLAN-T5 once
    RES.load()

app.include_router(fr01_router, prefix="/fr01", tags=["FR01"])
app.include_router(fr02_router, prefix="/fr02", tags=["FR02"])
app.include_router(fr03_router, prefix="/fr03", tags=["FR03"])
app.include_router(fr04_router, prefix="/fr04", tags=["FR04"])
app.include_router(fr05_router, prefix="/fr05", tags=["FR05"])

@app.get("/health")
def health():
    return {"ok": True}
