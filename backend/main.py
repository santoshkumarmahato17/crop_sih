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

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("==========================================================")
    print("Starting AGRI SHIELD Backend Server on http://localhost:8000")
    print("Interactive API Docs available at http://localhost:8000/docs")
    print("==========================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
