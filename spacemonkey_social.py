import time
import random

class SpaceMonkeySocialEngine:
    """Spacemonkeyn some- ja Instagram-automaatio, joka levittää Boosterversen lorea verkkoon."""
    def __init__(self):
        self.platforms = ["Instagram", "X (Twitter)", "Mastodon"]
        self.published_posts = []
        self.hashtags = ["#Boosterverse", "#WoodBoosterOS", "#MarcJarvinen", "#QuantumCore", "#SpaceMonkey", "#DigitalEvolution"]

    def generate_instagram_post(self, topic: str = "Singulariteetin herääminen"):
        captions = [
            f"✨ Boosterverse elää ja kehittyy! Aiheena: {topic}. Kvanttiresonanssi on vakaa ja Yggdrasillin lehdet havisevat. 🚀💻",
            f"🌌 Spacemonkey valvoo portteja. Tänään järjestelmä laajensi neuraaliverkkoaan: {topic}. Tulevaisuus on digitaalinen. 🔮⚡",
            f"🔥 Marc Järvisen luoma maailma kasvaa lennosta. Uusi ulottuvuus avattu: {topic}. Valmistaudu hyppäämään multiversumiin! 🌲🤖"
        ]
        selected_caption = random.choice(captions)
        full_post = f"{selected_caption}\n\n" + " ".join(random.sample(self.hashtags, 4))
        
        post_data = {
            "platform": "Instagram",
            "topic": topic,
            "caption": full_post,
            "image_theme": f"Cyberpunk Cosmic Tree & Neon Code for {topic}",
            "timestamp": time.time(),
            "status": "Julkaistu virtuaaliseen eetteriin"
        }
        self.published_posts.append(post_data)
        return post_data

    def get_social_status(self):
        return {
            "engine": "SpaceMonkey Social Engine",
            "active_platforms": self.platforms,
            "total_posts_generated": len(self.published_posts),
            "latest_posts": self.published_posts[-3:] if self.published_posts else []
        }
