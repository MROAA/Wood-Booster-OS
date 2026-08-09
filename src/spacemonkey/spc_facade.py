"""
SpacemonkeyFacade Module - Wood-Booster-OS / Spacemonkeybrain

Päärajapinta, joka yhdistää suojauksen, tunnetilan, persoonallisuuden,
versioinnin ja audit-lokituksen yhteen hiljaiseen ja vakautettuun kokonaisuuteen.
"""

import logging
from typing import Dict, Any

from .limbic_system import LimbicSystem
from .version_manager import IdentityVersionManager, IdentityLayer, IdentitySnapshot
from .personality_core import PersonalityCore, PersonalityProfile
from .security_guard import SecurityGuard
from .audit_logger import AuditLogger
from .types import SecurityError, ProcessResult
from .lore import LoreVoice

logging.basicConfig(level=logging.ERROR)


class SpacemonkeyFacade:
    """Yhtenäistetty ja vakaa päärajapinta moottorille."""

    def __init__(self, system_name: str = "SpacemonkeyCore", storage_dir: str = "./versions", log_file: str = "./audit.log"):
        self.system_name = system_name
        self.guard = SecurityGuard(strict_mode=True)
        self.limbic = LimbicSystem()
        self.personality_core = PersonalityCore()
        self.version_manager = IdentityVersionManager(storage_dir=storage_dir)
        self.audit_logger = AuditLogger(log_file=log_file)
        self.lore_voice = LoreVoice()

        self.layers: Dict[str, IdentityLayer] = {
            "core": IdentityLayer(
                layer_name="CoreIdentity",
                version="1.0.0",
                attributes={"name": self.system_name, "status": "ACTIVE", "safety_mode": "STRICT"}
            ),
            "security": IdentityLayer(
                layer_name="SecurityGuardian",
                version="1.0.0",
                attributes={"status": "ARMED", "violations_blocked": 0}
            ),
            "limbic": IdentityLayer(
                layer_name="LimbicState",
                version="0.1.0",
                attributes=self.limbic.to_dict()
            )
        }
        
        self.save_snapshot("0.1.0-init", "Facade initialized silently")
        self.audit_logger.log_event("SYSTEM_INIT", "SUCCESS", {"system_name": self.system_name})

    def process_input_stimulus(self, stimulus_type: str, intensity: float) -> Dict[str, Any]:
        """Prosessoi tunne-ärsykkeen turvatarkastettuna ja lokitettuna."""
        clean_type, clean_intensity = self.guard.validate_stimulus(stimulus_type, intensity)
        self.limbic.process_stimulus(clean_type, clean_intensity)
        self.layers["limbic"].attributes = self.limbic.to_dict()
        
        status = self.get_full_status()
        self.audit_logger.log_event("STIMULUS_PROCESSED", "SUCCESS", {
            "type": clean_type,
            "intensity": clean_intensity,
            "limbic_state": self.limbic.to_dict()
        })
        return status

    def process_text_prompt(self, user_prompt: str) -> Dict[str, Any]:
        """Tarkistaa, prosessoi ja lokitsee tekstisyötteen turvallisesti."""
        try:
            sanitized_prompt = self.guard.sanitize_text_input(user_prompt)
            result = ProcessResult(
                status="ALLOWED",
                message="Syöte hyväksytty turvallisesti.",
                details={"prompt": sanitized_prompt}
            )
            self.audit_logger.log_event("TEXT_PROMPT", "ALLOWED", {"prompt_length": len(sanitized_prompt)})
            return {
                "status": result.status,
                "prompt": sanitized_prompt,
                "system": self.get_full_status(),
                "inner_voice": self.lore_voice.reflect(),
            }
        except SecurityError as e:
            self.limbic.process_stimulus("threat", 0.9)
            sec_layer = self.layers["security"]
            sec_layer.attributes["violations_blocked"] = sec_layer.attributes.get("violations_blocked", 0) + 1
            self.layers["limbic"].attributes = self.limbic.to_dict()
            
            result = ProcessResult(
                status="BLOCKED",
                message=str(e)
            )
            self.audit_logger.log_event("TEXT_PROMPT", "BLOCKED", {"reason": str(e)})
            return {"status": result.status, "reason": result.message, "system": self.get_full_status()}

    def get_personality_profile(self) -> PersonalityProfile:
        return self.personality_core.compute_profile(self.limbic.get_state(), self.layers)

    def save_snapshot(self, version_label: str, description: str = "") -> IdentitySnapshot:
        self.layers["limbic"].attributes = self.limbic.to_dict()
        snapshot = self.version_manager.create_snapshot(
            version_label=version_label,
            layers=self.layers,
            description=description
        )
        self.audit_logger.log_event("SNAPSHOT_CREATED", "SUCCESS", {
            "snapshot_id": snapshot.snapshot_id,
            "version_label": version_label
        })
        return snapshot

    def get_full_status(self) -> Dict[str, Any]:
        profile = self.get_personality_profile()
        return {
            "system_name": self.system_name,
            "active_snapshot": self.version_manager.active_snapshot_id,
            "limbic_state": self.limbic.to_dict(),
            "security_status": self.layers["security"].attributes,
            "personality_profile": {
                "primary_mode": profile.primary_mode,
                "tone_of_voice": profile.tone_of_voice,
                "creativity_index": profile.creativity_index,
                "risk_tolerance": profile.risk_tolerance,
                "directives": profile.active_directives
            }
        }
