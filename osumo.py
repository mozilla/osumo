from datetime import datetime
import os

from flask import Flask, render_template, make_response

from settings import DEBUG, BASE_URL, SUMO_URL

app_folder = os.path.dirname(os.path.abspath(__file__))
prefix_length = len(app_folder)

if DEBUG:
  def get_all_script_paths():
    scripts = []
    for root, subdirs, files in os.walk(os.path.join(app_folder, 'static/js/develop')):
      for fname in files:
        if fname.endswith('.js'):
          scripts.append(root[prefix_length:] + '/' + fname)

    return scripts

  def version():
    return datetime.now().ctime()

  def partials():
    p = []
    for root, subdir, files in os.walk(os.path.join(app_folder, 'static/partials')):
      for fname in files:
        if fname.endswith('.html'):
          p.append(root[prefix_length:] + '/' + fname)

    return p

else:
  def get_all_script_paths():
    # minified js.. should be one.
    return ['/static/js/app.js']

  def version():
    return 1

  def partials():
    return []


def read_file(path):
  with open(path) as f:
    return f.read()

# Epic cache time~
FILES = {
  'manifest.webapp': read_file(os.path.join(app_folder, 'manifests', 'manifest.webapp')),
}

app = Flask(__name__)

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

@app.route('/manifest.webapp')
def manifest_file():
  response = make_response(FILES['manifest.webapp'])
  response.mimetype = 'application/x-web-app-manifest+json'
  return response

@app.route('/manifest.appcache')
def appcache():
  response = make_response(render_template('manifest.appcache', version=version(), partials=partials()))
  response.mimetype = 'text/cache-manifest'
  response.cache_control.no_cache = True
  return response

# Catch all URL for HTML push state
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def main(path):
  return render_template('app.html')