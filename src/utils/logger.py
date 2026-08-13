from loguru import logger
import sys

# Määritellään lokitusasetukset
logger.remove()
logger.add(sys.stderr, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>")
logger.add("logs/wood_booster.log", rotation="10 MB", level="INFO")

def get_logger(name):
    return logger.bind(name=name)
