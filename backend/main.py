from backend.modules.paranoia_shield import ParanoiaShieldMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.modules.system_pulse import router as pulse_router
from backend.modules.data_layer import router as data_router
from backend.modules.constitution_guard import ConstitutionGuardMiddleware
from backend.modules.spacemonkey_alter_ego import router as altrako_router
from backend.modules.git_guardian import router as gitguardian_router

app = FastAPI(
    title="Wood Booster HQ - Python Core Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rekisteröidään moduulit
app.include_router(pulse_router, prefix="/api/pulse", tags=["System Pulse & Version Control"])
app.include_router(data_router, prefix="/api/data", tags=["Data Layer"])
app.include_router(gitguardian_router, prefix="/api/gitguardian", tags=["Git Guardian"])
app.add_middleware(ParanoiaShieldMiddleware)
@app.get("/")
def read_root():
    return {"status": "online", "system": "Wood Booster HQ Python Core Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8002, reload=True)
