"""
KISAN SATHI Authentication Pre-Commit / CI Regression Runner.

Executes the permanent authentication test suite and reports status.
"""

import sys
import pytest

def main():
    print("==============================================================")
    print("   KISAN SATHI AUTHENTICATION REGRESSION TEST RUNNER   ")
    print("==============================================================")

    exit_code = pytest.main([
        "-v",
        "backend/tests/test_auth_full_regression.py",
        "-W", "ignore::DeprecationWarning",
    ])

    if exit_code == 0:
        print("\n==============================================================")
        print("   [SUCCESS] ALL AUTHENTICATION REGRESSION TESTS PASSED!   ")
        print("==============================================================")
        sys.exit(0)
    else:
        print("\n==============================================================")
        print("   [FAILURE] AUTHENTICATION REGRESSION DETECTED!           ")
        print("==============================================================")
        sys.exit(exit_code)

if __name__ == "__main__":
    main()
