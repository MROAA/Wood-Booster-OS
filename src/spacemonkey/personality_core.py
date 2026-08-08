"""
PersonalityCore Module - Wood-Booster-OS / Spacemonkeybrain

Sopeuttaa Spacemonkeyn olemassa olevat identiteettikerrokset (IdentityLayers)
ja tunnetilan (LimbicState) dynamisen persoonallisuuden ja viestinnän ohjaimiksi.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List

from .limbic_system import LimbicState
from .version_manager import IdentityLayer


@dataclass
class PersonalityProfile:
    primary_mode: str
    tone_of_voice: str
    creativity_index: float
    risk_tolerance: float
    active_directives: List[str] = field(default_factory=list)


class PersonalityCore:
    def __init__(self):
        self.identity_weights: Dict[str, float] = {
            "CoreIdentity": 1.0,
            "LimbicState": 0.8,
            "SecurityGuardian": 0.9,
            "InnovationLayer": 0.75
        }

    def compute_profile(
        self, 
        limbic_state: LimbicState, 
        existing_layers: Dict[str, IdentityLayer]
    ) -> PersonalityProfile:
        security_layer = existing_layers.get("SecurityGuardian") or existing_layers.get("core")
        safety_mode = "STRICT"
        if security_layer and isinstance(security_layer.attributes, dict):
            safety_mode = security_layer.attributes.get("safety_mode", "STRICT")

        creativity = min(1.0, max(0.0, (limbic_state.curiosity * 0.7) + (limbic_state.valence * 0.3)))
        
        base_risk = 0.5 - (limbic_state.stress * 0.4)
        if safety_mode == "STRICT":
            base_risk = min(0.3, base_risk)
        risk_tolerance = min(1.0, max(0.0, base_risk))

        if limbic_state.stress > 0.6:
            primary_mode = "PROTECTIVE_GUARDIAN"
            tone = "Suora, valpas, järjestelmäturvallisuutta priorisoiva (No BS)."
        elif limbic_state.curiosity > 0.6 and limbic_state.valence >= 0.0:
            primary_mode = "INNOVATIVE_CYBERPUNK_OPERATOR"
            tone = "Energinen, ennakkoluuloton, ratkaisukeskeinen co-founder vibe."
        elif limbic_state.valence < -0.3:
            primary_mode = "ANALYTICAL_RECOVERY"
            tone = "Kriittinen, syitä analysoiva ja vakauttava."
        else:
            primary_mode = "PRAGMATIC_ARCHITECT"
            tone = "Tasainen, modulaarista ja puhdasta koodiarkkitehtuuria painottava."

        directives = [f"Safety Mode: {safety_mode}"]
        for name, layer in existing_layers.items():
            if hasattr(layer, "attributes") and isinstance(layer.attributes, dict):
                mode = layer.attributes.get("status") or layer.attributes.get("mode")
                if mode:
                    directives.append(f"{name}: {mode}")

        return PersonalityProfile(
            primary_mode=primary_mode,
            tone_of_voice=tone,
            creativity_index=round(creativity, 2),
            risk_tolerance=round(risk_tolerance, 2),
            active_directives=directives
        )
