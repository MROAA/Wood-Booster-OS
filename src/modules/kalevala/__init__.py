import psutil
from utils.logger import get_logger

log = get_logger("KalevalaCore")

# ... (sisällä luokassa)
    def run_epic_chronicles(self):
        log.info("Aloitetaan eeppinen Kalevala-sykli...")
        process = psutil.Process(os.getpid())
        
        for mod in self.modules:
            # Monitoroidaan muistinkulutusta ennen moduuliajoa
            mem_before = process.memory_info().rss / 1024 / 1024
            
            # Ajetaan metodit
            # ... (aiempi logiikka)
            
            mem_after = process.memory_info().rss / 1024 / 1024
            log.info(f"Moduuli {mod.__class__.__name__} suoritettu. Muistinkulutus: {mem_after:.2f} MB (+{mem_after-mem_before:.2f} MB)")
