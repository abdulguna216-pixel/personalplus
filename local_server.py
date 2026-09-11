#!/usr/bin/env python3
import json
import os
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load_env():
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


class Handler(SimpleHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/lead":
            return self.send_json(404, {"error": "Not found"})

        try:
            length = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self.send_json(400, {"error": "Некорректные данные."})

        required = ["type", "city", "role", "amount", "shift", "date", "name", "phone"]
        if any(not str(data.get(field, "")).strip() for field in required) or not data.get("consent"):
            return self.send_json(400, {"error": "Заполните все обязательные поля."})

        token = os.environ.get("TELEGRAM_BOT_TOKEN")
        chat_id = os.environ.get("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            return self.send_json(500, {"error": "Telegram не настроен."})

        message = "\n".join([
            "🔔 Новая тестовая заявка с localhost «Персонал+»", "",
            f"Имя: {data['name']}", f"Телефон: {data['phone']}",
            f"Тип объекта: {data['type']}", f"Город: {data['city']}",
            f"Профессия: {data['role']}", f"Количество: {data['amount']}",
            f"Смена: {data['shift']}", f"Дата начала: {data['date']}",
        ])
        request = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=json.dumps({"chat_id": chat_id, "text": message}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                if response.status != 200:
                    raise RuntimeError("Telegram API error")
        except (urllib.error.URLError, RuntimeError):
            return self.send_json(502, {"error": "Не удалось отправить заявку в Telegram."})

        return self.send_json(200, {"ok": True})


if __name__ == "__main__":
    load_env()
    os.chdir(ROOT)
    print("Personal Plus: http://127.0.0.1:4173")
    ThreadingHTTPServer(("127.0.0.1", 4173), Handler).serve_forever()
