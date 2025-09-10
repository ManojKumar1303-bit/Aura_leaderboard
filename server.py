#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import os

# Change to the directory containing the HTML files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}/")
        print("Press Ctrl+C to stop the server")
        webbrowser.open(f'http://localhost:{PORT}/index.html')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
