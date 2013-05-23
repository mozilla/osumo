from flask import Flask, render_template

from settings import DEBUG

if DEBUG:
    import os
    def get_all_script_paths():
        scripts = []
        app_folder = os.path.dirname(os.path.abspath(__file__))
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

# application setup
app = Flask(__name__)

@app.before_request
def before_request():
    app.jinja_env.globals['scripts'] = get_all_script_paths()

# Catch all URL for HTML push state
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def main(path):
    return render_template('app.html')