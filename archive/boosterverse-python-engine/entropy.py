class EntropyEngine:
    def __init__(self):
        self.chaos = 15.0
    def measure_entropy(self):
        return {"entropy_percent": self.chaos, "stability_percent": 100.0 - self.chaos, "system_state": "Stable"}
    def inject_negentropy(self):
        self.chaos = max(5.0, self.chaos - 25.0)
        return {"message": "Negentropia injektoitu.", "new_entropy": self.chaos}
