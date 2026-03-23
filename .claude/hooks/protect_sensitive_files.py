#!/usr/bin/env python3
"""
PreToolUse hook: Protect sensitive files before Write/Edit tool invocations
"""
import json
import re
import sys
from typing import Any, Dict

DENY_PATH_PATTERNS = [
 r"(^|/)\.env(\.|$)",
 r"(^|/)secrets?(\.|/|$)",
 r"(^|/)\.ssh(/|$)",
 r"\.pem$",
 r"\.p12$",
 r"\.key$",
 r"(^|/)\.claude/settings\.local\.json$"
]

def main() -> None:
 try:
 raw_input = sys.stdin.read()
 if not raw_input.strip():
 print(json.dumps({"decision": "allow"}))
 return
 payload: Dict[str, Any] = json.loads(raw_input)
 except json.JSONDecodeError as e:
 # Allow on JSON parse failure (prevent hook failure from blocking work)
 print(json.dumps({"decision": "allow"}))
 return
 except Exception as e:
 print(json.dumps({"decision": "allow"}))
 return

 tool_input = payload.get("tool_input") or {}
 path = tool_input.get("file_path") or tool_input.get("path") or ""

 if not path:
 print(json.dumps({"decision": "allow"}))
 return

 path_norm = str(path).replace("\\", "/")

 for pat in DENY_PATH_PATTERNS:
 if re.search(pat, path_norm, flags=re.IGNORECASE):
 print(json.dumps({
 "decision": "block",
 "reason": (
 f"Blocked: editing a path identified as a sensitive file: {path_norm}. "
 "Manage environment variables/keys via local secret management (.env, vault, etc.) and do not include them in code/prompts."
 )
 }))
 return

 print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
 main()
