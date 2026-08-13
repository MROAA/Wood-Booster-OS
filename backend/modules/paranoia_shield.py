import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Seurataan IP-osoitteita ja pyyntöjen aikaleimoja yksinkertaisessa välimuistissa
request_tracker = {}

class ParanoiaShieldMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Siivotaan vanhat merkinnät (pidetään vain viimeiset 10 sekuntia)
        if client_ip in request_tracker:
            request_tracker[client_ip] = [t for t in request_tracker[client_ip] if current_time - t < 10]
        else:
            request_tracker[client_ip] = []
            
        # Lisätään uusi pyyntö lokiin
        request_tracker[client_ip].append(current_time)
        
        # Paranoia-sääntö: Jos tulee yli 20 pyyntöä 10 sekunnissa, Altrako hermostuu!
        if len(request_tracker[client_ip]) > 20:
            return JSONResponse(
                status_code=429,
                content={
                    "status": "paranoia_triggered",
                    "guardian": "Altrako (Core Guardian & Shield 🐵🍌)",
                    "error": "PARANOIA SHIELD: Liian monta pyyntöä lyhyessä ajassa! Altrako pistää portit säppiin hetkeksi."
                }
            )

        response = await call_next(request)
        return response
