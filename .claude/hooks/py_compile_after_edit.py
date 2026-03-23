#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from typing import Any, Dict

def _py_compile(path: str) -> subprocess.CompletedProcess:
 return subprocess.run(
 [sys.executable, "-m", "py_compile", path],
 stdout=subprocess.PIPE,
 stderr=subprocess.PIPE,
 text=True,
 )

def main() -> None:
 try:
 payload: Dict[str, Any] = json.load(sys.stdin)
 except Exception:
 print(json.dumps({"decision": "allow"}))
 return

 tool_input = payload.get("tool_input") or {}
 path = tool_input.get("file_path") or tool_input.get("path") or ""
 if not path:
 print(json.dumps({"decision": "allow"}))
 return

 path_norm = str(path).replace("\\", "/")
 if not path_norm.endswith(".py"):
 print(json.dumps({"decision": "allow"}))
 return

 if not os.path.exists(path_norm):
 print(json.dumps({"decision": "allow"}))
 return

 proc = _py_compile(path_norm)
 if proc.returncode != 0:
 msg = (proc.stderr or proc.stdout or "").strip()
 print(json.dumps({
 "decision": "block",
 "reason": f"Blocked: Python syntax error detected in edited file: {path_norm}\n{msg}"
 }))
 return

 print(json.dumps({
 "decision": "allow",
 "hookSpecificOutput": {
 "hookEventName": "PostToolUse",
 "additionalContext": f"py_compile OK: {path_norm}"
 }
 }))

if __name__ == "__main__":
 main()
