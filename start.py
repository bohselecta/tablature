"""Open the packaged Live Canvas on localhost. No API, account, or external server."""
import functools
import http.server
from pathlib import Path
import threading
import webbrowser

root=Path(__file__).resolve().parent/'dist'
if not (root/'index.html').is_file():
    raise SystemExit('Built app missing. In this folder run npm ci, then npm run build, then python3 start.py.')
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
url=f'http://127.0.0.1:{server.server_port}'
print(f'Flawless Dawless Live Canvas: {url}\nKeep this terminal open. Press Ctrl+C to stop.')
threading.Timer(.3,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
