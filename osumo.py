import hashlib
import os
import urllib

from flask import Flask, render_template, make_response, abort, request
import requests

from settings import (
    APP_FOLDER,
    DEBUG,
    BASE_URL,
    SUMO_URL,
    APP_FOLDER_LENGTH,
    JS_DEVELOP_FOLDER,
    STATIC_FOLDER,
    PARTIALS_FOLDER,
    MANIFEST_FILE_LOCATION
)


class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    # This way we don't collide with angular.
    jinja_options.update({
        'variable_start_string': '{[',
        'variable_end_string': ']}'
    })


APPCACHE_FILES = ['/static/js/locales.js']


def add_directory_to_appcache(*paths):
    for path in paths:
        for root, subdirs, files in os.walk(path):
            for fname in files:
                APPCACHE_FILES.append(root[APP_FOLDER_LENGTH:] + '/' + fname)


def read_file(path):
    with open(path) as f:
        return f.read()


if DEBUG:
    add_directory_to_appcache(os.path.join(STATIC_FOLDER, 'js', 'vendors'),
                              JS_DEVELOP_FOLDER,
                              PARTIALS_FOLDER,
                              os.path.join(STATIC_FOLDER, 'img'),
                              os.path.join(STATIC_FOLDER, 'css'))

    def get_all_script_paths():
        # We need to ensure that app.js loads first.
        scripts = ['/static/js/develop/app.js']
        for root, subdirs, files in os.walk(JS_DEVELOP_FOLDER):
            for fname in files:
                if fname == 'app.js':
                    continue
                if fname.endswith('.js'):
                    scripts.append(root[APP_FOLDER_LENGTH:] + '/' + fname)

        return scripts

    def version():
        s = hashlib.sha1()
        for fname in APPCACHE_FILES:
            content = read_file(os.path.join(APP_FOLDER, fname.strip('/')))
            s.update(content)
        return s.hexdigest()

    def get_app_manifest():
        return read_file(MANIFEST_FILE_LOCATION)
else:
    add_directory_to_appcache(os.path.join(STATIC_FOLDER, 'js', 'vendors'),
                              os.path.join(STATIC_FOLDER, 'img'),
                              os.path.join(STATIC_FOLDER, 'css'),
                              PARTIALS_FOLDER)
    APPCACHE_FILES.append('/static/js/app.js')

    def get_all_script_paths():
        # minified js.. should be one.
        return ['/static/js/app.js']

    file_hashes = hashlib.sha1()
    for fname in APPCACHE_FILES:
        content = read_file(os.path.join(APP_FOLDER, fname.strip('/')))
        file_hashes.update(content)

    file_hashes = file_hashes.hexdigest()

    def version():
        return file_hashes

    def partials():
        return []

    # Epic cache time~
    FILES = {
        'manifest.webapp': read_file(MANIFEST_FILE_LOCATION),
    }

    def get_app_manifest():
        return FILES['manifest.webapp']


app = CustomFlask(__name__)


@app.before_request
def before_request():
    app.jinja_env.globals['BASE_URL'] = BASE_URL
    app.jinja_env.globals['SUMO_URL'] = SUMO_URL
    app.jinja_env.globals['scripts'] = get_all_script_paths()


@app.route('/manifest.webapp')
def manifest_file():
    response = make_response(get_app_manifest())
    response.mimetype = 'application/x-web-app-manifest+json'
    return response


@app.route('/manifest.appcache')
def appcache():
    response = make_response(render_template('manifest.appcache',
                                             files=APPCACHE_FILES,
                                             version=version()))

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


# Catch all URL for HTML push state
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def main(path):
    return render_template('app.html')
