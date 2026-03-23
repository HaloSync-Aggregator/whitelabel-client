#!/usr/bin/env python3
import json
import re
import sys
from typing import Any, Dict

SECRET_PATTERNS = [
 r"POLARHUB_SECRET",
 r"SECRET_KEY",
 r"ACCESS_KEY",
 r"API_KEY",
 r"-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----",
 r"authorization:\s*hmac\s+username=",
 r"\bx-date:\b",
 r"\bdigest:\s*SHA-512=",
]

def main() -> None:
 try:
 payload: Dict[str, Any] = json.load(sys.stdin)
 except Exception:
 print(json.dumps({"decision": "allow"}))
 return

 prompt = (
 payload.get("user_prompt", "")
 or payload.get("prompt", "")
 or payload.get("input", "")
 or ""
 )

 joined = "\n".join(SECRET_PATTERNS)
 if re.search(joined, prompt, flags=re.IGNORECASE):
 print(json.dumps({
 "decision": "block",
 "reason": (
 "Blocked: the prompt appears to contain secret keys, auth headers, or sensitive information. "
 "Manage keys/headers/large JSON via files (.env, json) and only include file paths in prompts."
 )
 }))
 return

 print(json.dumps({
 "decision": "allow",
 "hookSpecificOutput": {
 "hookEventName": "UserPromptSubmit",
 "additionalContext": (
 "Token savings: save large JSON (requests/responses) to files and share paths only. "
 "For PolarHub calls, prefer the polarhub-booking skill's Python scripts (signing/request generation)."
 )
 }
 }))

if __name__ == "__main__":
 main()
