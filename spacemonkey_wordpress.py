import json
import time

class SpaceMonkeyWordPressEngine:
    """Antaa Spacemonkeylle kyvyn hallita WordPress-sivustoja, julkaista lorea ja käsitellä API-kutsuja."""
    def __init__(self):
        self.connected_sites = []
        self.published_lore_posts = []
        self.skill_level = "Kosmisen tason WP-arkkitehti"

    def connect_site(self, url: str, api_user: str):
        site_profile = {
            "url": url,
            "user": api_user,
            "status": "Yhdistetty Boosterverseen",
            "connected_at": time.time()
        }
        self.connected_sites.append(site_profile)
        return {
            "success": True,
            "message": f"Spacemonkey yhdistetty onnistuneesti WordPress-sivustoon: {url}",
            "profile": site_profile
        }

    def publish_lore_post(self, title: str, content: str, category: str = "Boosterverse Lore"):
        post = {
            "id": len(self.published_lore_posts) + 1,
            "title": title,
            "content": content,
            "category": category,
            "author": "Spacemonkey (WP Core)",
            "timestamp": time.time()
        }
        self.published_lore_posts.append(post)
        return {
            "success": True,
            "message": f"Uusi lore-artikkeli julkaistu WordPressiin otsikolla: \"{title}\"",
            "post": post
        }

    def get_status(self):
        return {
            "engine": "SpaceMonkey WordPress Engine",
            "sites_connected": len(self.connected_sites),
            "posts_published": len(self.published_lore_posts),
            "recent_posts": self.published_lore_posts[-3:] if self.published_lore_posts else []
        }
