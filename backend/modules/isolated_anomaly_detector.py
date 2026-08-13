import time
from typing import Dict, Any, List

class IsolatedAnomalyDetector:
    """
    Itsenäinen kvantti-anomalioiden ja epäilyttävien datavirtojen tunnistin.
    Valvoo järjestelmän sisäistä eheyttä ja hälyttää poikkeamista.
    """
    def __init__(self):
        self.anomaly_count = 0
        self.anomaly_ledger: List[Dict[str, Any]] = []

    def scan_data_stream(self, data_packet: str) -> Dict[Any, Any]:
        """
        Skannaa datapaketin epätavallisten merkkijonojen, vuotojen tai
        anomalioiden varalta.
        """
        # Esimerkkihegemonia: tarkistetaan epäilyttävän pitkät tai oudot merkkijonot
        is_anomalous = False
        reason = "Normal data stream"

        if len(data_packet) > 5000:
            is_anomalous = True
            reason = "Ylisuuri datapaketti (Mahdollinen muistivuoto- tai puskurin ylivuoto-yritys)"
        elif "eval(" in data_packet or "exec(" in data_packet:
            is_anomalous = True
            reason = "Havaittu dynaamisen koodin ajo-yritys (eval/exec)"

        if is_anomalous:
            self.anomaly_count += 1
            anomaly_record = {
                "timestamp": time.time(),
                "severity": "HIGH",
                "reason": reason,
                "snippet": data_packet[:80]
            }
            self.anomaly_ledger.append(anomaly_record)
            
            return {
                "secure": False,
                "detector": "Quantum Anomaly Detector 🌌⚡",
                "alert": "ANOMALIA HAVAITTU!",
                "reason": reason,
                "total_anomalies": self.anomaly_count
            }

        return {
            "secure": True,
            "detector": "Quantum Anomaly Detector 🌌⚡",
            "message": "Data-virta puhdas. Ei poikkeamia."
        }

    def get_anomaly_status(self) -> Dict[Any, Any]:
        """Palauttaa tilastot ja havaitut poikkeamat tulevaa API-kytkentää varten."""
        return {
            "module": "Quantum Anomaly Detector",
            "status": "armed",
            "total_detected": self.anomaly_count,
            "recent_anomalies": self.anomaly_ledger[-5:]
        }

# Globaali instanssi valmiina tulevia kytkentöjä varten
anomaly_detector = IsolatedAnomalyDetector()
