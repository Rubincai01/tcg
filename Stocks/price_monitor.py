#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Referer": "https://gu.qq.com/",
    "Accept": "*/*",
}
QUOTE_PATTERN = re.compile(r'v_([^=]+)="([^"]*)";')
DEFAULT_CONFIG = Path(__file__).with_name("watchlist.json")
DEFAULT_STATE = Path(__file__).with_name(".runtime").joinpath("state.json")
DEFAULT_LOG = Path(__file__).with_name("alerts.log")
DEFAULT_INTERVAL = 15
DEFAULT_COOLDOWN = 180


@dataclass
class Target:
    symbol: str
    market: str
    name: Optional[str]
    entry_price: Optional[float]
    exit_price: Optional[float]
    entry_direction: str
    exit_direction: str
    enabled: bool


@dataclass
class Quote:
    quote_code: str
    name: str
    symbol: str
    price: float
    prev_close: Optional[float]
    open_price: Optional[float]

    @property
    def change(self) -> Optional[float]:
        if self.prev_close in (None, 0):
            return None
        return round(self.price - self.prev_close, 4)

    @property
    def change_pct(self) -> Optional[float]:
        if self.prev_close in (None, 0):
            return None
        return round((self.price - self.prev_close) / self.prev_close * 100, 2)


def safe_float(value: Any) -> Optional[float]:
    if value in (None, "", "--"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_market(value: Optional[str]) -> str:
    return (value or "AUTO").strip().upper()


def infer_a_share_prefix(symbol: str) -> str:
    if symbol.startswith(("5", "6", "9")):
        return "sh"
    return "sz"


def normalize_quote_code(symbol: str, market: Optional[str]) -> str:
    raw = symbol.strip().lower()
    if raw.startswith(("sh", "sz", "hk")) and len(raw) >= 7:
        return raw

    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        raise ValueError(f"无法识别证券代码: {symbol}")

    market_upper = normalize_market(market)
    if market_upper == "HK":
        return f"hk{digits.zfill(5)}"
    if market_upper == "SH":
        return f"sh{digits.zfill(6)}"
    if market_upper == "SZ":
        return f"sz{digits.zfill(6)}"

    if len(digits) == 5:
        return f"hk{digits}"
    if len(digits) == 6:
        return f"{infer_a_share_prefix(digits)}{digits}"
    raise ValueError(f"无法根据代码推断市场: {symbol}")


def load_targets(config_path: Path) -> tuple[dict[str, Any], list[Target]]:
    config = json.loads(config_path.read_text(encoding="utf-8"))
    targets: list[Target] = []
    for item in config.get("targets", []):
        target = Target(
            symbol=str(item["symbol"]).strip(),
            market=normalize_market(item.get("market")),
            name=item.get("name"),
            entry_price=safe_float(item.get("entry_price")),
            exit_price=safe_float(item.get("exit_price")),
            entry_direction=(item.get("entry_direction") or "below_or_equal").strip(),
            exit_direction=(item.get("exit_direction") or "above_or_equal").strip(),
            enabled=bool(item.get("enabled", True)),
        )
        if target.enabled:
            targets.append(target)
    if not targets:
        raise ValueError("watchlist.json 里没有启用的 targets")
    return config, targets


def fetch_quotes(quote_codes: list[str]) -> dict[str, Quote]:
    url = "https://qt.gtimg.cn/q=" + ",".join(quote_codes)
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()
    text = response.content.decode("gbk", errors="ignore")
    quotes: dict[str, Quote] = {}
    for match in QUOTE_PATTERN.finditer(text):
        quote_code = match.group(1).lower()
        payload = match.group(2)
        if not payload or payload == "1" or payload.startswith("1~") is False and "~" not in payload:
            continue
        parts = payload.split("~")
        if len(parts) < 6:
            continue
        price = safe_float(parts[3])
        if price is None:
            continue
        quotes[quote_code] = Quote(
            quote_code=quote_code,
            name=parts[1] or quote_code.upper(),
            symbol=parts[2] or quote_code[2:],
            price=price,
            prev_close=safe_float(parts[4]),
            open_price=safe_float(parts[5]),
        )
    return quotes


def load_state(state_path: Path) -> dict[str, Any]:
    if not state_path.exists():
        return {}
    try:
        return json.loads(state_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_state(state_path: Path, state: dict[str, Any]) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def compare_price(price: float, threshold: Optional[float], direction: str) -> bool:
    if threshold is None:
        return False
    direction = direction.strip().lower()
    if direction == "below_or_equal":
        return price <= threshold
    if direction == "above_or_equal":
        return price >= threshold
    raise ValueError(f"不支持的方向: {direction}")


def format_price(value: Optional[float]) -> str:
    if value is None:
        return "--"
    if value >= 1000:
        return f"{value:.2f}"
    if value >= 100:
        return f"{value:.3f}"
    if value >= 1:
        return f"{value:.3f}"
    return f"{value:.4f}"


def build_alerts(
    targets: list[Target],
    quotes: dict[str, Quote],
    state: dict[str, Any],
    cooldown_seconds: int,
) -> list[dict[str, Any]]:
    now_ts = time.time()
    alerts: list[dict[str, Any]] = []
    for target in targets:
        quote_code = normalize_quote_code(target.symbol, target.market)
        quote = quotes.get(quote_code)
        if quote is None:
            continue
        quote_state = state.setdefault(quote_code, {})
        display_name = target.name or quote.name
        for rule_name, threshold, direction, state_key in (
            ("入场", target.entry_price, target.entry_direction, "entry_hit"),
            ("出场", target.exit_price, target.exit_direction, "exit_hit"),
        ):
            if threshold is None:
                continue
            met = compare_price(quote.price, threshold, direction)
            was_met = bool(quote_state.get(state_key, False))
            last_alert_at = float(quote_state.get(f"{state_key}_alert_at", 0))
            should_alert = met and (not was_met) and (now_ts - last_alert_at >= cooldown_seconds)
            quote_state[state_key] = met
            if should_alert:
                quote_state[f"{state_key}_alert_at"] = now_ts
                alerts.append(
                    {
                        "quote_code": quote_code,
                        "display_name": display_name,
                        "rule_name": rule_name,
                        "threshold": threshold,
                        "direction": direction,
                        "price": quote.price,
                        "symbol": quote.symbol,
                    }
                )
    return alerts


def render_snapshot(targets: list[Target], quotes: dict[str, Quote]) -> str:
    lines = [f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 最新报价"]
    for target in targets:
        quote_code = normalize_quote_code(target.symbol, target.market)
        quote = quotes.get(quote_code)
        label = target.name or (quote.name if quote else target.symbol)
        if quote is None:
            lines.append(f"- {label:<12} {target.symbol:<8} 获取失败")
            continue
        change_text = "--"
        if quote.change is not None and quote.change_pct is not None:
            sign = "+" if quote.change > 0 else ""
            change_text = f"{sign}{quote.change:.3f} ({sign}{quote.change_pct:.2f}%)"
        lines.append(
            f"- {label:<12} {quote.symbol:<8} 现价 {format_price(quote.price):>8}  涨跌 {change_text:>18}"
        )
    return "\n".join(lines)


def escape_applescript(text: str) -> str:
    return text.replace("\\", "\\\\").replace('"', '\\"')


def notify_macos(title: str, subtitle: str, body: str) -> None:
    script = (
        f'display notification "{escape_applescript(body)}" '
        f'with title "{escape_applescript(title)}" '
        f'subtitle "{escape_applescript(subtitle)}" sound name "Glass"'
    )
    subprocess.run(["osascript", "-e", script], check=False)


def emit_alerts(alerts: list[dict[str, Any]], notify_config: dict[str, Any], log_path: Path) -> None:
    if not alerts:
        return
    log_path.parent.mkdir(parents=True, exist_ok=True)
    for alert in alerts:
        message = (
            f"{alert['display_name']}({alert['symbol']}) {alert['rule_name']}触发："
            f"现价 {format_price(alert['price'])}，阈值 {format_price(alert['threshold'])}"
        )
        line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}"
        print("\n🚨 " + line)
        with log_path.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
        if notify_config.get("terminal_bell", True):
            print("\a", end="", flush=True)
        if sys.platform == "darwin" and notify_config.get("macos_notification", True):
            notify_macos("价格提醒", alert["display_name"], message)


def run_once(config_path: Path, state_path: Path, once: bool = False) -> int:
    config, targets = load_targets(config_path)
    quote_codes = [normalize_quote_code(item.symbol, item.market) for item in targets]
    quotes = fetch_quotes(quote_codes)
    if not quotes:
        print("没有拿到有效行情，请稍后重试。", file=sys.stderr)
        return 2

    print(render_snapshot(targets, quotes))
    state = load_state(state_path)
    cooldown_seconds = int(config.get("cooldown_seconds", DEFAULT_COOLDOWN))
    alerts = build_alerts(targets, quotes, state, cooldown_seconds)
    emit_alerts(alerts, config.get("notification", {}), Path(config.get("log_file", DEFAULT_LOG)))
    save_state(state_path, state)
    return 0


def run_loop(config_path: Path, state_path: Path) -> int:
    config, _ = load_targets(config_path)
    interval = int(config.get("poll_interval_seconds", DEFAULT_INTERVAL))
    print(f"开始监控，轮询间隔 {interval} 秒。按 Ctrl+C 停止。\n")
    while True:
        try:
            return_code = run_once(config_path, state_path)
            if return_code != 0:
                return return_code
            time.sleep(interval)
            print()
        except KeyboardInterrupt:
            print("\n已停止监控。")
            return 0
        except Exception as exc:  # noqa: BLE001
            print(f"监控异常: {exc}", file=sys.stderr)
            time.sleep(min(interval, 10))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="港股 / A股 / 场内 ETF 价格监控器")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="监控配置文件路径")
    parser.add_argument("--state-file", default=str(DEFAULT_STATE), help="状态文件路径")
    parser.add_argument("--once", action="store_true", help="只抓取一次价格并评估提醒")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config_path = Path(args.config).expanduser().resolve()
    state_path = Path(args.state_file).expanduser().resolve()
    if not config_path.exists():
        print(f"配置文件不存在: {config_path}", file=sys.stderr)
        return 1
    if args.once:
        return run_once(config_path, state_path, once=True)
    return run_loop(config_path, state_path)


if __name__ == "__main__":
    raise SystemExit(main())
