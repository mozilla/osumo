import time
import os
import urllib
import json

from flask import Flask, render_template, make_response, abort, request
import requests

from settings import DEBUG, BASE_URL, SUMO_URL


class CustomFlask(Flask):
  jinja_options = Flask.jinja_options.copy()
  jinja_options.update({
    'variable_start_string': '[[',
    'variable_end_string': ']]'
  })


app_folder = os.path.dirname(os.path.abspath(__file__))
prefix_length = len(app_folder)

languages = requests.get(SUMO_URL + "offline/get-languages").json()["languages"]
LANGUAGES = []
for language in languages:
  LANGUAGES.append({"id": language[0], "name": language[1]})
LANGUAGES = json.dumps(LANGUAGES)
del languages
del language

def read_file(path):
  with open(path) as f:
    return f.read()


if DEBUG:
  def get_all_script_paths():
    scripts = []
    for root, subdirs, files in os.walk(os.path.join(app_folder, 'static/js/develop')):
      for fname in files:
        if fname.endswith('.js'):
          scripts.append(root[prefix_length:] + '/' + fname)

    return scripts

  def version():
    return int(time.time() / 10)


  def partials():
    p = []
    for root, subdir, files in os.walk(os.path.join(app_folder, 'static/partials')):
      for fname in files:
        if fname.endswith('.html'):
          p.append(root[prefix_length:] + '/' + fname)

    return p

  def get_app_manifest():
    return read_file(os.path.join(app_folder, 'manifests', 'manifest.webapp'))

  def get_translation(locale):
    try:
      return read_file(os.path.join(app_folder, 'translations', locale + '.json'))
    except (OSError, IOError):
      return None

else:
  def get_all_script_paths():
    # minified js.. should be one.
    return ['/static/js/app.js']

  def version():
    return 1

  def partials():
    return []

  # Epic cache time~
  FILES = {
    'manifest.webapp': read_file(os.path.join(app_folder, 'manifests', 'manifest.webapp')),
  }

  def _discover_translations():
    for root, subdir, files in os.walk(os.path.join(app_folder, 'translations')):
      for fname in files:
        if fname.endswith('.json'):
          FILES[fname] = json.dumps(json.loads(read_file(os.path.join(root, fname))))

  _discover_translations()
  del _discover_translations

  def get_app_manifest():
    return FILES['manifest.webapp']

  def get_translation(locale):
    return FILES.get(locale + '.json')


app = CustomFlask(__name__)

# AngularJS E2E Testing. Why is this so complicated..
if DEBUG:
  @app.route('/_tests/unittests')
  def unittests():
    scripts = app.jinja_env.globals['scripts'][:]
    # TODO: needs to refactor with get_all_script_paths
    for root, subdir, files in os.walk(os.path.join(app_folder, 'static/js/tests/unittests')):
      for fname in files:
        if fname.endswith('.js'):
          scripts.append(root[prefix_length:] + '/' + fname)

    return render_template('unittests.html', scripts=scripts)

  @app.route('/_tests/e2e')
  def e2etests():
    scripts = []
    for root, subdir, files in os.walk(os.path.join(app_folder, 'static/js/tests/e2e')):
      for fname in files:
        if fname.endswith('.js'):
          scripts.append(root[prefix_length: + '/' + fname])
    return render_template('e2etests.html', scripts=scripts)

@app.before_request
def before_request():
  app.jinja_env.globals['BASE_URL'] = BASE_URL
  app.jinja_env.globals['SUMO_URL'] = SUMO_URL
  app.jinja_env.globals['scripts'] = get_all_script_paths()
  app.jinja_env.globals['LANGUAGES'] = LANGUAGES

@app.route('/manifest.webapp')
def manifest_file():
  response = make_response(get_app_manifest())
  response.mimetype = 'application/x-web-app-manifest+json'
  return response

@app.route('/manifest.appcache')
def appcache():
  response = make_response(render_template('manifest.appcache', version=version(), partials=partials()))
  response.mimetype = 'text/cache-manifest'
  response.cache_control.no_cache = True
  return response

@app.route("/images")
def images():
  if 'url' not in request.args:
    return abort(400)

  target = "https://support.cdn.mozilla.net/" + request.args['url']
  response = requests.get(target)
  if response.status_code == 200:
    response = make_response("data:image/png;base64," + urllib.quote(response.content.encode('base64')))
    response.mimetype = 'text/plain'
    return response
  else:
    return abort(response.status_code)

@app.route("/i18n/<locale>")
def i18nfiles(locale):
  translation = get_translation(locale)
  if translation is None:
    return abort(404)
  response = make_response(translation)
  response.mimetype = 'application/json'
  return response


# Catch all URL for HTML push state
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def main(path):
  return render_template('app.html')