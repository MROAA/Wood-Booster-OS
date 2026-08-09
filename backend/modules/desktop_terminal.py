"""
Boosterverse Desktop Terminal

Purpose:
    Oikea, interaktiivinen pääte selaimessa - todellinen pseudo-terminaali
    (pty), jossa käyttäjän oma kuori (fish, tai varalla bash/sh) ajaa
    todellisia komentoja tällä koneella. Tämä EI ole simuloitu tai
    rajoitettu - tämä on tietoisesti pyydetty, oikea komentojen ajo.

Responsibilities:
    Yhdistää yksi WebSocket-yhteys yhteen pty-prosessiin: välittää
    näppäinpainallukset kuoren stdiniin ja kuoren tulosteen takaisin
    selaimeen sellaisenaan (xterm.js tulkitsee ANSI-koodit).

Dependencies:
    Vain Python-vakiokirjasto (pty, os, fcntl, termios, struct).

Turvallisuus:
    - Kuunnellaan VAIN 127.0.0.1 (backend/main.py).
    - CORS rajattu localhost-origineihin (backend/main.py).
    - Työhakemisto asetetaan Wood-Booster-AI-projektikansioon käynnistyessä
      (sama lähtöpiste kuin tiedostonhallinnalla), mutta käyttäjä voi
      tietysti "cd" minne tahansa - se on juuri sitä mitä oikea pääte
      tarkoittaa. Ei mitään keinotekoista sandboxia tämän jälkeen.
    - Jokainen selainyhteys saa oman erillisen kuoriprosessinsa, joka
      tapetaan kun WebSocket-yhteys katkeaa.
"""

import asyncio
import fcntl
import os
import pty
import shutil
import struct
import termios
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)


def resolve_shell() -> str:
    for candidate in ("/usr/bin/fish", "/bin/fish", shutil.which("fish")):
        if candidate and os.path.exists(candidate):
            return candidate
    return os.environ.get("SHELL") or "/bin/bash"


def set_winsize(fd: int, rows: int, cols: int):
    try:
        winsize = struct.pack("HHHH", rows, cols, 0, 0)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)
    except OSError:
        pass


@router.websocket("/terminal")
async def terminal_ws(websocket: WebSocket):
    await websocket.accept()

    shell = resolve_shell()
    pid, master_fd = pty.fork()

    if pid == 0:
        # Lapsiprosessi - pty.fork() on jo kytkenyt stdin/stdout/stderr
        # pty-slaveen. Korvataan prosessi kuorella.
        try:
            os.chdir(PROJECT_ROOT)
        except OSError:
            pass
        try:
            os.execvp(shell, [shell])
        except OSError:
            os._exit(1)

    # Vanhempi prosessi (FastAPI-worker) jatkaa tästä.
    flags = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)
    set_winsize(master_fd, 24, 80)

    loop = asyncio.get_event_loop()
    output_queue: asyncio.Queue = asyncio.Queue()

    def on_pty_readable():
        try:
            data = os.read(master_fd, 4096)
        except OSError:
            data = b""
        output_queue.put_nowait(data if data else None)

    loop.add_reader(master_fd, on_pty_readable)

    async def pump_output():
        while True:
            data = await output_queue.get()
            if data is None:
                await websocket.close()
                return
            try:
                await websocket.send_bytes(data)
            except Exception:
                return

    pump_task = asyncio.create_task(pump_output())

    try:
        while True:
            message = await websocket.receive()

            if message.get("type") == "websocket.disconnect":
                break

            text = message.get("text")
            raw = message.get("bytes")

            if text is not None:
                if text.startswith("\x00RESIZE:"):
                    try:
                        cols_str, rows_str = text[len("\x00RESIZE:"):].split(",")
                        set_winsize(master_fd, int(rows_str), int(cols_str))
                    except (ValueError, OSError):
                        pass
                else:
                    os.write(master_fd, text.encode("utf-8"))
            elif raw is not None:
                os.write(master_fd, raw)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        loop.remove_reader(master_fd)
        pump_task.cancel()
        try:
            os.kill(pid, 9)
        except ProcessLookupError:
            pass
        try:
            os.close(master_fd)
        except OSError:
            pass
