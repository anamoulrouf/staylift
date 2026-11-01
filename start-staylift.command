#!/bin/zsh
# Double-click to install and start Staylift. Output is also saved to logs/.
cd "$(dirname "$0")"
mkdir -p logs
# Pick up Node from Homebrew, nvm, fnm or Volta if Terminal didn't load it.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.volta/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
command -v fnm >/dev/null 2>&1 && eval "$(fnm env)" >/dev/null 2>&1

{
  echo "== $(date)"
  echo "folder: $(pwd)"
  echo "node: $(command -v node) $(node -v 2>&1)"
  echo "npm:  $(command -v npm) $(npm -v 2>&1)"
  echo "arch: $(uname -m)"
} | tee logs/env.log

if ! command -v npm >/dev/null 2>&1; then
  echo ""
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org,"
  echo "then double-click start-staylift.command again."
  echo "NO_NODE" >> logs/env.log
  read -k1 "?Press any key to close."
  exit 1
fi

echo "\n== npm install (first run takes a few minutes)"
npm install --no-audit --no-fund 2>&1 | tee logs/install.log
if [ ${pipestatus[1]} -ne 0 ]; then
  echo "\nInstall failed. The error is above and in logs/install.log."
  echo "INSTALL_FAILED" >> logs/install.log
  read -k1 "?Press any key to close."
  exit 1
fi

echo "\n== Starting Staylift at http://localhost:8080 (leave this window open; Ctrl+C stops it)"
( sleep 6; open "http://localhost:8080" ) &
npm run dev 2>&1 | tee logs/dev.log
