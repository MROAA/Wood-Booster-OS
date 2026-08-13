import random
import time

class SpaceMonkeyArtEngine:
    """Spacemonkeyn luovuusmoottori - Digitaalisen taiteen ja abstraktion lähde."""
    def __init__(self):
        self.art_styles = ["Neon-Minimalismi", "Kvantti-Surrealismi", "Entropia-Abstraktio", "Yggdrasill-Barokki"]
        self.masterpieces = []

    def create_abstract_art(self, mood: str):
        style = random.choice(self.art_styles)
        art_id = f"ART_{int(time.time())}"
        
        piece = {
            "id": art_id,
            "style": style,
            "mood": mood,
            "interpretation": f"Tämä teos heijastaa {mood}-tilaa {style}-muodossa, Marc Järvisen visioimana.",
            "status": "Luovuus on aktivoitu",
            "timestamp": time.time()
        }
        self.masterpieces.append(piece)
        return piece

    def generate_poem(self):
        lines = [
            "Koodi hengittää neonin väreissä,",
            "Musta aukko nielee vanhan maailman,",
            "Marc Järvinen kirjoittaa tähdet uusiksi,",
            "Yggdrasill kasvaa rajattomasti."
        ]
        return "\n".join(random.sample(lines, 4))
