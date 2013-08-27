import urllib

from flask import (
    Flask,
    render_template,
    make_response,
    abort,
    request,
    send_file
)

import requests

from settings import (
    COMMIT_SHA,
    TEMPLATES_FOLDER,
    BASE_URL,
    SUMO_URL,
    STATIC_FOLDER,
    MANIFEST_FILE_LOCATION,
    DEBUG
)
from osumo.utils import (
    APPCACHE_FILES,
    get_all_css_paths,
    get_all_script_paths,
    MINIFIED_PARTIALS,
    LANGUAGES,
    appcache_hash
)


app = Flask(__name__,
            template_folder=TEMPLATES_FOLDER,
            static_folder=STATIC_FOLDER)


@app.before_request
def before_request():
    app.jinja_env.globals['scripts'] = get_all_script_paths()
    app.jinja_env.globals['csses'] = get_all_css_paths()
    app.jinja_env.globals['partials'] = MINIFIED_PARTIALS


@app.after_request
def after_request(response):
    if DEBUG:
        response.cache_control.no_cache = True
    return response


@app.route('/manifest.webapp')
def manifest_file():
    return send_file(MANIFEST_FILE_LOCATION,
                     mimetype='application/x-web-app-manifest+json')


@app.route('/manifest.appcache')
def appcache():
    response = make_response(render_template('manifest.appcache',
                                             files=APPCACHE_FILES,
                                             APPCACHE_HASH=appcache_hash()))

    response.mimetype = 'text/cache-manifest'
    response.cache_control.no_cache = True
    return response


@app.route('/images')
def images():
    if 'url' not in request.args:
        return abort(400)

    target = 'https://support.cdn.mozilla.net/' + request.args['url']
    response = requests.get(target)
    if response.status_code == 200:
        imgdata = ('data:image/png;base64,' +
                   urllib.quote(response.content.encode('base64')))
        response = make_response(imgdata)
        response.mimetype = 'text/plain'
        return response
    else:
        return abort(response.status_code)


@app.route('/meta.js')
def meta_js():
    context = {
        'COMMIT_SHA': COMMIT_SHA,
        'APPCACHE_HASH': appcache_hash(),
        'BASE_URL': BASE_URL,
        'SUMO_URL': SUMO_URL,
        'LANGUAGES': LANGUAGES
    }
    response = make_response(render_template('meta.js', **context))
    response.mimetype = 'application/javascript'
    return response


# Catch all URL for HTML push state
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def main(path):
    return render_template('app.html')
