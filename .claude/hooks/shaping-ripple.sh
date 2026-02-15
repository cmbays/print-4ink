#!/bin/bash
# Shaping ripple check — reminds agent to maintain multi-level consistency
# when editing shaping documents (files with shaping: true frontmatter).
# Fires on Write and Edit to .md files.

FILE=$(jq -r '.tool_input.file_path // empty')
if [[ "$FILE" == *.md && -f "$FILE" ]]; then
  if head -5 "$FILE" 2>/dev/null | grep -q '^shaping: true'; then
    cat >&2 <<'MSG'
Ripple check:
- Changed Requirements? → update Fit Check + Gaps
- Changed Shape Parts? → update Fit Check + Gaps
- Updated Breadboard diagram? → Tables are source of truth. Update tables FIRST
- Changed Slices? → verify slice demos still work
MSG
    exit 2
  fi
fi
exit 0
