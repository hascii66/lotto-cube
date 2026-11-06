"""Same-origin data API and production static server. No browser-side scraping."""
import argparse
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import time
from urllib.parse import urlparse

from fetch_lotto import DEFAULT_OUTPUT, ensure_history, read_existing

# ponytail: one process per data directory; use a shared job lock when deploying replicas.
LOCK = threading.Lock()
LAST_ATTEMPT = 0.0
STATUS = {"status": "stale", "checkedAt": None, "error": None}


def history_response():
    global LAST_ATTEMPT, STATUS
    with LOCK:
        if time.monotonic() - LAST_ATTEMPT >= 120:
            LAST_ATTEMPT = time.monotonic()
            try:
                _, metadata = ensure_history(DEFAULT_OUTPUT, 10)
                STATUS = {"status": "current", "checkedAt": metadata["checkedAt"], "error": None}
            except Exception:
                STATUS = {**STATUS, "status": "stale", "error": "source-unavailable"}
        return {**STATUS, "draws": sorted(read_existing(DEFAULT_OUTPUT).values(), key=lambda d: d['date'], reverse=True)}


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/history':
            try:
                payload = history_response()
                data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
            except (OSError, ValueError):
                data = b'{"error":"history-unavailable"}'
                self.send_response(503)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if path.startswith('/api/'):
            self.send_error(404)
            return
        super().do_GET()

    def end_headers(self):
        if urlparse(self.path).path in ('/', '/index.html', '/sw.js', '/manifest.webmanifest'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8787)
    parser.add_argument('--directory', default=str(Path(__file__).resolve().parents[1] / 'dist'))
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), lambda *a, **kw: Handler(*a, directory=args.directory, **kw))
    print(f'LottoCube server: http://{args.host}:{args.port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
