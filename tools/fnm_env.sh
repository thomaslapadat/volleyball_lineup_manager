# Source this file to activate the FNM-managed Node environment.
# Usage (from any shell or script):
#   source tools/fnm_env.sh
#
# This is needed in non-login shells (e.g. CI, agent bash calls) where
# ~/.bashrc has not been sourced and FNM is not on PATH.

FNM_PATH="/home/thomas/.local/share/fnm"

if [ -d "$FNM_PATH" ]; then
  export PATH="$FNM_PATH:$PATH"
  eval "$(fnm env)"
else
  echo "ERROR: FNM not found at $FNM_PATH. Install via: curl -fsSL https://fnm.vercel.app/install | bash" >&2
  exit 1
fi
