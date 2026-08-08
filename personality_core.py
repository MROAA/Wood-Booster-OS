"""
PersonalityCore Module - Wood-Booster-OS / Spacemonkeybrain

Sopeuttaa Spacemonkeyn olemassa olevat identiteettikerrokset (IdentityLayers)
ja tunnetilan (LimbicState) dinamisen persoonallisuuden, viben ja päätöksenteon ohjaimiksi.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

# Tuodaan aiemmat moduulit
from limbic_system import LimbicState
from version_manager import IdentityLayer


@dataclass
class PersonalityProfile:
    """Käyttäytymisprofiili ja ilmaisutyyli, joka lasketaan identiteeteistä ja tunnetilasta."""
    primary_mode: str          # Esim: "INNOVATIVE_OPERATOR", "ANALYTICAL_GUARD", "CYBERPUNK_COFOUNDER"
    tone_of_voice: str          # Äänensävy ja vibe
    creativity_index: float     # 0.0 - 1.0 (Laskettu uteliaisuudesta ja mielialasta)
    risk_tolerance: float      # 0.0 - 1.0 (Laskettu stressistä ja turva-asetuksista)
    active_directives: List[str] = field(default_factory=list)


class PersonalityCore:
    """
    Persoonallisuusydin, joka kytkee olemassa olevat identiteettikerrokset
    ja limbiset signaalit yhtenäiseksi persoonallisuusprofiiliksi.
    """

    def __init__(self):
        # Määritetään olemassa olevien identiteettikerrosten painotusjärjestelmä
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
        """
        Laskee ja yhdistää olemassa olevat identiteettikerrokset ja tunnetilan 
        aktiiviseksi persoonallisuusprofiiliksi.
        """
        # 1. Tarkistetaan turvallisuus- ja guard-kerrokset
        security_layer = existing_layers.get("SecurityGuardian") or existing_layers.get("core")
        safety_mode = "STRICT"
        if security_layer and isinstance(security_layer.attributes, dict):
            safety_mode = security_layer.attributes.get("safety_mode", "STRICT")

        # 2. Lasketaan luovuus ja riskinsietokyky (Creativity & Risk Tolerance)
        creativity = min(1.0, max(0.0, (limbic_state.curiosity * 0.7) + (limbic_state.valence * 0.3)))
        
        # Jos stressi on korkea tai safety_mode on STRICT, riskinsieto pienenee
        base_risk = 0.5 - (limbic_state.stress * 0.4)
        if safety_mode == "STRICT":
            base_risk = min(0.3, base_risk)
        risk_tolerance = min(1.0, max(0.0, base_risk))

        # 3. Määritetään primäärimoodi ja äänensävy (Tone of Voice)
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

        # 4. Kootaan aktiiviset toimintaohjeet (Directives) kerrosten pohjalta
        directives = [f"Safety Mode: {safety_mode}"]
        for name, layer in existing_layers.items():
            if hasattr(layer, "attributes") and isinstance(layer.attributes, dict):
                mode = layer.attributes.get("status") or layer.attributes.get("mode")
                if mode:
                    directives.append(f"{name}: {mode}")

        profile = PersonalityProfile(
            primary_mode=primary_mode,
            tone_of_voice=tone,
            creativity_index=round(creativity, 2),
            risk_tolerance=round(risk_tolerance, 2),
            active_directives=directives
        )

        return profile


if __name__ == "__main__":
    # Yksikkötesti & kerrosintegraatio
    core = PersonalityCore()
    
    # Mockataan olemassa olevat identiteettikerrokset
    mock_layers = {
        "CoreIdentity": IdentityLayer(
            layer_name="CoreIdentity",
            version="1.0.0",
            attributes={"safety_mode": "STRICT", "status": "ACTIVE"}
        ),
        "InnovationLayer": IdentityLayer(
            layer_name="InnovationLayer",
            version="0.5.0",
            attributes={"mode": "HIGH_DRIVE"}
        )
    }

    limbic = LimbicState(valence=0.4, arousal=0.5, stress=0.1, curiosity=0.8)
    profile = core.compute_profile(limbic, mock_layers)

    print("--- Laskettu PersonalityProfile ---")
    print("Primary Mode:", profile.primary_mode)
    print("Tone:", profile.tone_of_voice)
    print("Creativity Index:", profile.creativity_index)
    print("Risk Tolerance:", profile.risk_tolerance)
    print("Directives:", profile.active_directives)
