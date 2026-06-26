#!/usr/bin/env python3
"""Start FastAPI backend + Next.js frontend together.

Usage:
  python dev.py          Fast mode: production build of the frontend, served
                         pre-compiled so every page/redirect is instant.
  python dev.py --dev    Hot-reload mode: `next dev` for active editing.
                         Code changes apply live, but the first visit to each
                         page compiles on demand (slower redirects).
"""
import os
import sys
import time
import socket
import hashlib
import threading
import webbrowser
import subprocess
import atexit

ROOT = os.path.dirname(os.path.abspath(__file__))
IS_WIN = sys.platform == "win32"
FRONTEND_PORT = 3000
BACKEND_PORT = 8000

FRONTEND_DIR = os.path.join(ROOT, "frontend")
BUILD_DIR = os.path.join(FRONTEND_DIR, ".next")
# Stored inside .next so a missing/wiped hash simply triggers a safe rebuild.
HASH_FILE = os.path.join(BUILD_DIR, ".devpy_src.hash")
# Source that affects the compiled output. If none of this changed since the
# last build, the existing .next is reused and the server starts immediately.
SRC_DIRS = ("app", "components", "lib", "hooks", "public")
SRC_FILES = ("package.json", "package-lock.json", "next.config.mjs",
             "tsconfig.json", "postcss.config.mjs", "tailwind.config.ts")
SRC_EXTS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json",
            ".svg", ".png", ".jpg", ".jpeg", ".webp")

_procs: list[subprocess.Popen] = []


def kill_port(port: int) -> None:
    """Kill whatever process is listening on the given port."""
    if IS_WIN:
        result = subprocess.run(
            f'netstat -ano | findstr ":{port} "',
            shell=True, capture_output=True, text=True,
        )
        pids_killed = set()
        for line in result.stdout.strip().splitlines():
            parts = line.strip().split()
            if len(parts) >= 5 and f":{port}" in parts[1] and parts[3] == "LISTENING":
                pid = parts[-1]
                if pid in pids_killed:
                    continue
                pids_killed.add(pid)
                # Try taskkill first, then PowerShell Stop-Process as fallback
                r = subprocess.run(
                    ["taskkill", "/F", "/PID", pid],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
                if r.returncode != 0:
                    subprocess.run(
                        ["powershell", "-Command", f"Stop-Process -Id {pid} -Force -ErrorAction SilentlyContinue"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    )
        # Wait for the port to be released
        if pids_killed:
            time.sleep(1.0)
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


def wait_for_port(port: int, host: str = "127.0.0.1", timeout: float = 180.0) -> bool:
    """Block until something is accepting connections on the port."""
    start = time.time()
    while time.time() - start < timeout:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            try:
                s.connect((host, port))
                return True
            except OSError:
                time.sleep(0.5)
    return False


def open_browser_when_ready(url: str, port: int) -> None:
    def _open():
        if wait_for_port(port):
            webbrowser.open(url)
    threading.Thread(target=_open, daemon=True).start()


def source_fingerprint() -> str:
    """Hash of all frontend source that affects the build output."""
    h = hashlib.sha256()
    paths: list[str] = []
    for d in SRC_DIRS:
        base = os.path.join(FRONTEND_DIR, d)
        for root, dirs, files in os.walk(base):
            dirs[:] = [x for x in dirs if x not in ("node_modules", ".next")]
            for f in files:
                if f.endswith(SRC_EXTS):
                    paths.append(os.path.join(root, f))
    for f in SRC_FILES:
        p = os.path.join(FRONTEND_DIR, f)
        if os.path.exists(p):
            paths.append(p)
    for p in sorted(paths):
        try:
            with open(p, "rb") as fh:
                h.update(p.replace(FRONTEND_DIR, "").encode())
                h.update(fh.read())
        except OSError:
            pass
    return h.hexdigest()


def needs_build() -> bool:
    """True unless a complete, up-to-date production build already exists."""
    if not os.path.exists(os.path.join(BUILD_DIR, "BUILD_ID")):
        return True  # no (complete) build present
    if not os.path.exists(HASH_FILE):
        return True
    try:
        with open(HASH_FILE, encoding="utf-8") as fh:
            saved = fh.read().strip()
    except OSError:
        return True
    return saved != source_fingerprint()


def build_frontend() -> bool:
    """Run `next build` and record the source fingerprint. True on success."""
    print("  Building frontend (production)... this takes ~15-25s.", flush=True)
    result = subprocess.run("npm run build", cwd=FRONTEND_DIR, shell=True)
    if result.returncode != 0:
        print("\n  [frontend] build FAILED. Fix the errors above and re-run.")
        return False
    try:
        with open(HASH_FILE, "w", encoding="utf-8") as fh:
            fh.write(source_fingerprint())
    except OSError:
        pass
    print("  Build complete.\n", flush=True)
    return True


def main() -> None:
    hot_reload = any(a in ("--dev", "-d") for a in sys.argv[1:])
    mode = "hot-reload (next dev)" if hot_reload else "fast (production build)"

    print()
    print("  The GenZ Way - dev")
    print("  -------------------")
    print(f"  mode     ->  {mode}")
    print(f"  frontend ->  http://localhost:{FRONTEND_PORT}")
    print(f"  backend  ->  http://127.0.0.1:{BACKEND_PORT}")
    print(f"  api docs ->  http://127.0.0.1:{BACKEND_PORT}/docs")
    if not hot_reload:
        print("  (use `python dev.py --dev` for live code reload while editing)")
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

    if hot_reload:
        frontend_cmd = "npm run dev"
    else:
        # Pre-compile so navigation is instant — but only rebuild when the
        # frontend source actually changed, so unchanged launches start fast.
        if needs_build():
            if not build_frontend():
                stop_all()
                sys.exit(1)
        else:
            print("  Frontend unchanged since last build - skipping rebuild.\n", flush=True)
        frontend_cmd = "npm run start"

    frontend = spawn(
        frontend_cmd,
        cwd=os.path.join(ROOT, "frontend"),
    )
    print(f"  [frontend] pid {frontend.pid}")
    print()
    print("  Browser will open once the frontend is ready.")
    print("  Ctrl+C to stop both servers.")
    print()

    open_browser_when_ready(f"http://localhost:{FRONTEND_PORT}", FRONTEND_PORT)

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
