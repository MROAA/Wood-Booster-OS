from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class CommandRequest(BaseModel):
    command: str
    context: Optional[dict] = None

class CommandResponse(BaseModel):
    status: str
    result: str
    engine: str = "Spacemonkey Python Core v1.0"

@router.post("/process", response_model=CommandResponse)
def process_spacemonkey_command(payload: CommandRequest):
    """
    Käsittelee käyttöliittymältä tulevat komennot ja ajaa Python-logiikan.
    """
    user_cmd = payload.command.strip()
    
    # Esimerkki Python-taustalaskennasta/logiikasta
    processed_output = f"Python Core käsitteli syötteen: '{user_cmd}'"
    
    return CommandResponse(
        status="success",
        result=processed_output
    )
