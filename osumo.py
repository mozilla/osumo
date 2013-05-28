import os

from flask import Flask, render_template, make_response

from settings import DEBUG

app_folder = os.path.dirname(os.path.abspath(__file__))

if DEBUG:
  def get_all_script_paths():
    scripts = []
    prefix_length = len(app_folder)
    for root, subdirs, files in os.walk(os.path.join(app_folder, 'static/js/develop')):
      for fname in files:
        if fname.endswith('.js'):
          scripts.append(root[prefix_length:] + '/' + fname)

    return scripts
else:
  def get_all_script_paths():
    # minified js.. should be one.
    return ['/static/js/app.js']


def read_file(path):
  with open(path) as f:
    return f.read()

# Epic cache time~
FILES = {
  'manifest.webapp': read_file(os.path.join(app_folder, 'manifests', 'manifest.webapp')),
  'cache.manifest': read_file(os.path.join(app_folder, 'manifests', 'cache.manifest'))
}

app = Flask(__name__)

@app.before_request
def before_request():
  app.jinja_env.globals['scripts'] = get_all_script_paths()

@app.route('/manifest.webapp')
def manifest_file():
  response = make_response(FILES['manifest.webapp'])
  response.mimetype = 'application/x-web-app-manifest+json'
  return response

@app.route('/cache.manifest')
def cache_manifest():
  return make_response(FILES['cache.manifest'])

# Catch all URL for HTML push state
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def main(path):
  return render_template('app.html')