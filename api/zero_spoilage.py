from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Include Executa plugin module
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "zero-spoilage", "executas", "zero-spoilage"))
try:
    import zero_spoilage_plugin
except ImportError:
    zero_spoilage_plugin = None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            req = json.loads(body.decode('utf-8'))
            method = req.get("method")
            args = req.get("args") or req.get("arguments") or {}

            if zero_spoilage_plugin:
                res = zero_spoilage_plugin.invoke(method, args)
            else:
                res = {"success": False, "error": "Plugin module not found"}

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
