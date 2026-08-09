import random
class BlackHoleEngine:
    def __init__(self):
        self.singularity_status = "Vakaa Horisontti"
        self.accretion_disk_temp = "10^6 Kelvin"
        self.compressed_data_mb = 0.0
    def get_black_hole_status(self):
        return {"entity": "Singularity", "status": self.singularity_status, "singularity_mass_mb": self.compressed_data_mb}
    def consume_entropy(self):
        return {"action": "Imetty", "absorbed_mb": 15.0, "message": "Musta aukko puhdisti entropian."}
