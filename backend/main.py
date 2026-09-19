"""
AGRI SHIELD — Main Entry Point for Local Development Server.
Execute directly with: python main.py
Or with uvicorn: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys

# Ensure repository root is in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Auto-switch to virtual environment Python if running under global Python missing uvicorn/fastapi
VENV_PYTHON = os.path.join(os.path.dirname(__file__), "venv", "Scripts", "python.exe")
if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = os.path.join(os.path.dirname(__file__), "venv", "bin", "python")

if os.path.exists(VENV_PYTHON) and os.path.abspath(sys.executable) != os.path.abspath(VENV_PYTHON):
    try:
        import uvicorn
        import fastapi
    except ImportError:
        print(f"--> Switch to virtualenv Python: {VENV_PYTHON}")
        import subprocess
        result = subprocess.run([VENV_PYTHON] + sys.argv)
        sys.exit(result.returncode)

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("==========================================================")
    print("Starting AGRI SHIELD Backend Server on http://localhost:8001")
    print("Interactive API Docs available at http://localhost:8001/docs")
    print("==========================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
