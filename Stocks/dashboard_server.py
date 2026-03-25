#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import threading
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from price_monitor import compare_price, fetch_quotes, load_targets, normalize_quote_code

DASHBOARD_HTML = Path(__file__).with_name("dashboard.html")
DEFAULT_CONFIG = Path(__file__).with_name("watchlist.json")

config_lock = threading.Lock()


def read_config(config_path: Path) -> dict:
    return json.loads(config_path.read_text(encoding="utf-8"))


def write_config(config_path: Path, config: dict) -> None:
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")


class DashboardHandler(BaseHTTPRequestHandler):
    server_version = "PriceDashboard/1.0"

    def _cors_headers(self) -> None:
        """Add CORS headers to every response so IDE embedded browsers work."""
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")

    def do_OPTIONS(self) -> None:  # noqa: N802
        """Handle CORS preflight requests."""
        self.send_response(HTTPStatus.NO_CONTENT)
        self._cors_headers()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.serve_index()
            return
        if parsed.path == "/api/quotes":
            self.serve_quotes()
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/targets":
            self.handle_add_target()
            return
        if parsed.path == "/api/targets/delete":
            self.handle_delete_target()
            return
        if parsed.path == "/api/targets/update":
            self.handle_update_target()
            return
        if parsed.path == "/api/targets/toggle":
            self.handle_toggle_target()
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return

    @property
    def config_path(self) -> Path:
        return self.server.config_path  # type: ignore[attr-defined]

    def _read_body_json(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def _json_response(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def serve_index(self) -> None:
        content = DASHBOARD_HTML.read_text(encoding="utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(content.encode("utf-8"))

    def serve_quotes(self) -> None:
        try:
            payload = build_payload(self.config_path)
            self._json_response(HTTPStatus.OK, payload)
        except Exception as exc:  # noqa: BLE001
            self._json_response(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(exc)})

    def handle_add_target(self) -> None:
        try:
            data = self._read_body_json()
            symbol = str(data.get("symbol", "")).strip()
            market = str(data.get("market", "")).strip().upper()
            name = str(data.get("name", "")).strip()
            entry_price = data.get("entry_price")
            exit_price = data.get("exit_price")
            if not symbol or market not in ("HK", "SH", "SZ", "A"):
                self._json_response(HTTPStatus.BAD_REQUEST, {"error": "symbol 和 market(HK/A) 必填"})
                return
            # market=A 时根据代码自动推断 SH/SZ
            if market == "A":
                digits = "".join(ch for ch in symbol if ch.isdigit())
                market = "SH" if digits.startswith(("5", "6", "9")) else "SZ"
            quote_code = normalize_quote_code(symbol, market)
            # 如果用户没手动填名称，尝试从行情接口获取中文名
            display_name = name
            if not display_name or display_name == symbol:
                try:
                    quotes = fetch_quotes([quote_code])
                    q = quotes.get(quote_code)
                    if q and q.name:
                        display_name = q.name
                except Exception:  # noqa: BLE001
                    pass
            display_name = display_name or symbol
            new_target = {
                "symbol": symbol,
                "market": market,
                "name": display_name,
                "entry_price": float(entry_price) if entry_price not in (None, "", "--") else None,
                "exit_price": float(exit_price) if exit_price not in (None, "", "--") else None,
                "entry_direction": "below_or_equal",
                "exit_direction": "above_or_equal",
                "enabled": True,
            }
            with config_lock:
                config = read_config(self.config_path)
                config.setdefault("targets", []).append(new_target)
                write_config(self.config_path, config)
            self._json_response(HTTPStatus.OK, {"ok": True, "message": f"已添加 {display_name}"})
        except Exception as exc:  # noqa: BLE001
            self._json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})

    def handle_delete_target(self) -> None:
        try:
            data = self._read_body_json()
            symbol = str(data.get("symbol", "")).strip()
            market = str(data.get("market", "")).strip().upper()
            if not symbol:
                self._json_response(HTTPStatus.BAD_REQUEST, {"error": "symbol 必填"})
                return
            with config_lock:
                config = read_config(self.config_path)
                before = len(config.get("targets", []))
                config["targets"] = [
                    t for t in config.get("targets", [])
                    if not (str(t.get("symbol", "")).strip() == symbol and str(t.get("market", "")).strip().upper() == market)
                ]
                after = len(config["targets"])
                write_config(self.config_path, config)
            removed = before - after
            self._json_response(HTTPStatus.OK, {"ok": True, "removed": removed, "message": f"已删除 {symbol} ({removed} 条)"})
        except Exception as exc:  # noqa: BLE001
            self._json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})

    def handle_update_target(self) -> None:
        try:
            data = self._read_body_json()
            symbol = str(data.get("symbol", "")).strip()
            market = str(data.get("market", "")).strip().upper()
            if not symbol:
                self._json_response(HTTPStatus.BAD_REQUEST, {"error": "symbol 必填"})
                return
            with config_lock:
                config = read_config(self.config_path)
                updated = 0
                for t in config.get("targets", []):
                    if str(t.get("symbol", "")).strip() == symbol and str(t.get("market", "")).strip().upper() == market:
                        if "entry_price" in data:
                            t["entry_price"] = float(data["entry_price"]) if data["entry_price"] not in (None, "", "--") else None
                        if "exit_price" in data:
                            t["exit_price"] = float(data["exit_price"]) if data["exit_price"] not in (None, "", "--") else None
                        if "name" in data:
                            t["name"] = str(data["name"]).strip()
                        updated += 1
                write_config(self.config_path, config)
            self._json_response(HTTPStatus.OK, {"ok": True, "updated": updated})
        except Exception as exc:  # noqa: BLE001
            self._json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})

    def handle_toggle_target(self) -> None:
        try:
            data = self._read_body_json()
            symbol = str(data.get("symbol", "")).strip()
            market = str(data.get("market", "")).strip().upper()
            enabled = bool(data.get("enabled", True))
            if not symbol:
                self._json_response(HTTPStatus.BAD_REQUEST, {"error": "symbol 必填"})
                return
            with config_lock:
                config = read_config(self.config_path)
                toggled = 0
                for t in config.get("targets", []):
                    if str(t.get("symbol", "")).strip() == symbol and str(t.get("market", "")).strip().upper() == market:
                        t["enabled"] = enabled
                        toggled += 1
                write_config(self.config_path, config)
            self._json_response(HTTPStatus.OK, {"ok": True, "toggled": toggled})
        except Exception as exc:  # noqa: BLE001
            self._json_response(HTTPStatus.BAD_REQUEST, {"error": str(exc)})


def build_payload(config_path: Path) -> dict:
    config, targets = load_targets(config_path)
    quote_codes = [normalize_quote_code(item.symbol, item.market) for item in targets]
    quotes = fetch_quotes(quote_codes)
    rows = []
    alert_count = 0
    for target in targets:
        quote_code = normalize_quote_code(target.symbol, target.market)
        quote = quotes.get(quote_code)
        entry_met = compare_price(quote.price, target.entry_price, target.entry_direction) if quote else False
        exit_met = compare_price(quote.price, target.exit_price, target.exit_direction) if quote else False
        alert_count += int(entry_met) + int(exit_met)
        rows.append(
            {
                "quote_code": quote_code,
                "market": target.market,
                "symbol": quote.symbol if quote else target.symbol,
                "name": (quote.name if quote else None) or target.name or target.symbol,
                "price": quote.price if quote else None,
                "prev_close": quote.prev_close if quote else None,
                "change": quote.change if quote else None,
                "change_pct": quote.change_pct if quote else None,
                "entry_price": target.entry_price,
                "exit_price": target.exit_price,
                "entry_direction": target.entry_direction,
                "exit_direction": target.exit_direction,
                "entry_met": entry_met,
                "exit_met": exit_met,
                "enabled": target.enabled,
            }
        )

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "poll_interval_seconds": int(config.get("poll_interval_seconds", 15)),
        "target_count": len(rows),
        "alert_count": alert_count,
        "rows": rows,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="价格监控网页面板")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config_path = Path(args.config).expanduser().resolve()
    server = ThreadingHTTPServer((args.host, args.port), DashboardHandler)
    server.config_path = config_path  # type: ignore[attr-defined]
    print(f"Dashboard running at http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
