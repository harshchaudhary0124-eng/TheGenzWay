#!/usr/bin/env python3
"""Start FastAPI backend + Next.js frontend together. Usage: python dev.py"""
import os
import sys
import time
import threading
import webbrowser
import subprocess
import atexit

ROOT = os.path.dirname(os.path.abspath(__file__))
IS_WIN = sys.platform == "win32"
FRONTEND_PORT = 3000
BACKEND_PORT = 8000

_procs: list[subprocess.Popen] = []


def kill_port(port: int) -> None:
    """Kill whatever process is listening on the given port."""
    if IS_WIN:
        result = subprocess.run(
            f'netstat -ano | findstr ":{port} "',
            shell=True, capture_output=True, text=True,
        )
        for line in result.stdout.strip().splitlines():
            parts = line.strip().split()
            if len(parts) >= 5 and f":{port}" in parts[1] and parts[3] == "LISTENING":
                subprocess.run(
                    ["taskkill", "/F", "/PID", parts[-1]],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
    else:
        subprocess.run(
            ["fuser", "-k", f"{port}/tcp"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )


def kill_tree(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    if IS_WIN:
        subprocess.call(
            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    else:
        proc.terminate()


def stop_all() -> None:
    for proc in _procs:
        kill_tree(proc)


atexit.register(stop_all)


def spawn(cmd: str, cwd: str) -> subprocess.Popen:
    proc = subprocess.Popen(cmd, cwd=cwd, shell=True)
    _procs.append(proc)
    return proc


def open_browser_after(url: str, delay: float) -> None:
    def _open():
        time.sleep(delay)
        webbrowser.open(url)
    threading.Thread(target=_open, daemon=True).start()


def main() -> None:
    print()
    print("  The GenZ Way - dev")
    print("  -------------------")
    print(f"  frontend ->  http://localhost:{FRONTEND_PORT}")
    print(f"  backend  ->  http://127.0.0.1:{BACKEND_PORT}")
    print(f"  api docs ->  http://127.0.0.1:{BACKEND_PORT}/docs")
    print()

    print("  Clearing ports...", flush=True)
    kill_port(FRONTEND_PORT)
    kill_port(BACKEND_PORT)
    time.sleep(0.5)

    backend = spawn(
        f"uvicorn app.main:app --host 0.0.0.0 --port {BACKEND_PORT} --reload",
        cwd=os.path.join(ROOT, "backend"),
    )
    print(f"  [backend]  pid {backend.pid}")

    frontend = spawn(
        "npm run dev",
        cwd=os.path.join(ROOT, "frontend"),
    )
    print(f"  [frontend] pid {frontend.pid}")
    print()
    print("  Browser will open in ~5 seconds once Next.js is ready.")
    print("  Ctrl+C to stop both servers.")
    print()

    open_browser_after(f"http://localhost:{FRONTEND_PORT}", delay=5.0)

    try:
        while True:
            if backend.poll() is not None:
                print("\n  [backend] crashed. Stopping frontend...")
                kill_tree(frontend)
                break
            if frontend.poll() is not None:
                print("\n  [frontend] crashed. Stopping backend...")
                kill_tree(backend)
                break
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n  Stopping both servers...")
        stop_all()
        print("  Done.")


if __name__ == "__main__":
    main()
