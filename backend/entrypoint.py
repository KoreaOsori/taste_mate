#!/usr/bin/env python3
"""Container entrypoint: set DNS for Supabase then run uvicorn. No shell = no CRLF issues."""
import os
import sys

def main():
    try:
        with open("/etc/resolv.conf", "w") as f:
            f.write("nameserver 8.8.8.8\nnameserver 8.8.4.4\n")
    except Exception as e:
        print(f"[entrypoint] Warning: could not set resolv.conf: {e}", file=sys.stderr)
    os.execvp("uvicorn", ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

if __name__ == "__main__":
    main()
