#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [ ! -x "$VENV_DIR/bin/python" ]; then
  echo "首次运行，正在创建虚拟环境并安装 requests ..."
  "$PYTHON_BIN" -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install requests >/dev/null
fi

exec "$VENV_DIR/bin/python" "$SCRIPT_DIR/price_monitor.py" "$@"
