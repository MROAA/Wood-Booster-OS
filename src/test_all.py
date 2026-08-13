import os
from utils.logger import get_logger

log = get_logger("SystemBoot")

def run_suite():
    log.info("Suoritetaan täysi järjestelmän integrointitesti...")
    os.system("python3 src/os_boot.py")
    log.info("Dashboardin käynnistys...")
    os.system("python3 src/dashboard.py")

if __name__ == "__main__":
    run_suite()
