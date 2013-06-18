from osumo import app

from settings import *

def main():
  if DEBUG:
    app.run(debug=True, host="", port=DEPLOY_PORT)
  else:
    # Probably needs to be changed depending on the server configurations.
    from gevent.wsgi import WSGIServer
    from werkzeug.contrib.fixer import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app)
    server = WSGIServer((DEPLOY_IP, DEPLOY_PORT), app)
    server.serve_forever()

if __name__ == '__main__':
  main()