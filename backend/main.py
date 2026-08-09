from backend.modules.paranoia_shield import ParanoiaShieldMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.modules.system_pulse import router as pulse_router
from backend.modules.data_layer import router as data_router
from backend.modules.constitution_guard import ConstitutionGuardMiddleware
from backend.modules.spacemonkey_alter_ego import router as altrako_router
from backend.modules.git_guardian import router as gitguardian_router
from backend.modules.git_guardian_scheduler import router as gitguardian_scheduler_router, start_autonomous_loop
from backend.modules.spacemonkey_core import router as spacemonkey_router
from backend.modules.desktop_files import router as desktop_files_router
from backend.modules.desktop_terminal import router as desktop_terminal_router

app = FastAPI(
    title="Wood Booster HQ - Python Core Engine",
    version="1.0.0"
)

# Rajattu localhostiin (mikä tahansa portti, koska useita kehityspalvelimia
# voi olla käynnissä samaan aikaan eri worktree-hakemistoissa). Aiempi
# allow_origins=["*"] olisi päästänyt MINKÄ TAHANSA verkkosivun tekemään
# pyyntöjä tähän API:in - vaarallista nyt kun täällä on oikeita komentoja
# ajava pääte-endpoint (backend/modules/desktop_terminal.py).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rekisteröidään moduulit
app.include_router(pulse_router, prefix="/api/pulse", tags=["System Pulse & Version Control"])
app.include_router(data_router, prefix="/api/data", tags=["Data Layer"])
app.include_router(gitguardian_router, prefix="/api/gitguardian", tags=["Git Guardian"])
app.include_router(gitguardian_scheduler_router, prefix="/api/gitguardian", tags=["Git Guardian"])
app.include_router(spacemonkey_router, prefix="/api/spacemonkey", tags=["Spacemonkey Core"])
app.include_router(altrako_router, prefix="/api/altrako", tags=["Altrako"])
app.include_router(desktop_files_router, prefix="/api/desktop", tags=["Boosterverse Desktop"])
app.include_router(desktop_terminal_router, prefix="/api/desktop", tags=["Boosterverse Desktop"])
app.add_middleware(ParanoiaShieldMiddleware)


@app.on_event("startup")
async def _start_git_guardian_autonomous():
    start_autonomous_loop()


@app.get("/")
def read_root():
    return {"status": "online", "system": "Wood Booster HQ Python Core Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8002, reload=True)
