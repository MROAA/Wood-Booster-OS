import re
import json
from datetime import datetime
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Kielletyt syötepatternit (suojaa ydintä)
BLOCKED_PATTERNS = [
    r"sudo\s+rm\s+-rf",
    r"mkfs\.",
    r":\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\};\s*:"  # Fork bomb -suoja
]

class ConstitutionGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Tarkistetaan vain POST/PUT-pyynnöt joissa on dataa
        if request.method in ["POST", "PUT"]:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    body_str = body_bytes.decode("utf-8")
                    
                    # Tarkistetaan onko syötteessä kiellettyjä komentoja
                    for pattern in BLOCKED_PATTERNS:
                        if re.search(pattern, body_str, re.IGNORECASE):
                            # Kirjataan audit-lokkiin
                            self._log_violation(pattern, body_str)
                            
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "status": "blocked",
                                    "error": "Constitution Guard: Turvallisuuskerros esti vaarallisen syötteen.",
                                    "reason": f"Havaittu kielletty syötepatterni: '{pattern}'"
                                }
                            )
            except Exception:
                pass  # Jos runkoa ei voi lukea, päästetään turvallisesti läpi

        response = await call_next(request)
        return response

    def _log_violation(self, pattern: str, details: str):
        """Kirjaa blokatun tapahtuman olemassa olevaan audit.log-tiedostoon."""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "API_GUARD_BLOCK",
            "status": "BLOCKED",
            "details": {
                "reason": f"Havaittu kielletty syötepatterni: '{pattern}'",
                "payload_snippet": details[:100]
            }
        }
        try:
            with open("audit.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception:
            pass
