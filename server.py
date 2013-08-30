from osumo import app


def main():
    if app.debug:
        app.run(debug=True, host="", port=app.config['DEPLOY_PORT'])
    else:
        from gevent.wsgi import WSGIServer
        from werkzeug.contrib.fixers import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app)
        server = WSGIServer(("", app.config['DEPLOY_PORT']), app)
        server.serve_forever()

if __name__ == '__main__':
    main()
