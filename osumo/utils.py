import hashlib
import json
import os
import re

from cssmin import cssmin
import requests
from slimit import minify

from settings import (
    SUMO_URL,
    APP_FOLDER,
    APP_FOLDER_LENGTH,
    CSS_FOLDER,
    DEBUG,
    JS_DEVELOP_FOLDER,
    PARTIALS_FOLDER,
    PRODUCTION_JS_FILE,
    PRODUCTION_CSS_FILE,
    STATIC_FOLDER
)

# a note about global variables: they're not easily testable! So right now this
# is fine. If we want to add tests, we probably need to rewrite this entire
# module with a class.
APPCACHE_FILES = ['/static/js/locales.js']
MINIFIED_PARTIALS = ''

LANGUAGES = requests.get(SUMO_URL + 'offline/get-languages').json()
LANGUAGES = json.dumps(LANGUAGES['languages'])


def get_files_in_dirs(*paths):
    dirs = []
    for path in paths:
        for root, subdirs, files in os.walk(path):
            for fname in files:
                dirs.append(root[APP_FOLDER_LENGTH:] + '/' + fname)

    return dirs


def read_file(path):
    with open(path) as f:
        return f.read()


def get_appcache_files_hashes(exclude=set(['/meta.js'])):
    file_hashes = hashlib.sha1()
    for fname in APPCACHE_FILES:
        if fname not in exclude:
            content = read_file(os.path.join(APP_FOLDER, fname.strip('/')))
            file_hashes.update(content)

    read_file(os.path.join(APP_FOLDER, 'templates', 'app.html'))

    return file_hashes.hexdigest()


use_strict_regex = re.compile(r'[\'"]use strict[\'"];')
def minify_js(filenames):
    """Returns a minified js string.

    Also strips out the 'use strict';
    """
    js = "'use strict';"
    for fname in filenames:
        with open(os.path.join(APP_FOLDER, fname.strip('/'))) as f:
            mini = minify(f.read(), mangle=True, mangle_toplevel=True)
            # get rid of 'use strict'; as we already have some.
            js += use_strict_regex.sub('', mini)

    return js


def minify_css(filenames):
    """Returns a minified css string.
    """
    css = ''
    for fname in filenames:
        with open(os.path.join(APP_FOLDER, fname.strip('/'))) as f:
            css += cssmin(f.read())
            css += '\n'
    return css


inline_partial = """
<script id="{path}" type="text/ng-template">
{content}
</script>
"""
def minify_partials(filenames):
    """Returns a minified partials string

    Note that angular's templateUrl not only means from the server but
    can also be an id that's on the page.
    """
    partials = ''
    for fname in filenames:
        with open(os.path.join(APP_FOLDER, fname.strip('/'))) as f:
            partials += inline_partial.format(path=fname,
                                              content=f.read())
    return partials


def get_all_script_paths():
    """Gets all the javascript paths to be included

    Note that this only contains the ones we wrote. This means nothing
    in vendors is included.
    """
    scripts = ['/static/js/develop/app.js']  # This always needs to be first.
    for root, _, filenames in os.walk(JS_DEVELOP_FOLDER):
        for fname in filenames:
            if fname == 'app.js':
                continue
            elif fname.endswith('.js'):
                scripts.append(root[APP_FOLDER_LENGTH:] + '/' + fname)

    return scripts


def get_all_partial_paths():
    """Gets a list of all the partials."""
    partials = []
    for root, _, filenames in os.walk(PARTIALS_FOLDER):
        for fname in filenames:
            if fname.endswith('.html'):
                partials.append(root[APP_FOLDER_LENGTH:] + '/' + fname)

    return partials


def get_all_css_paths():
    """Gets a list of all the css to be included."""
    csses = ['/static/css/gaia.css']  # Always needs to be first
    for root, _, filenames in os.walk(CSS_FOLDER):
        for fname in filenames:
            if fname in ('gaia.css', 'app.css', 'app.min.css'):
                continue
            elif fname.endswith('.css'):
                csses.append(root[APP_FOLDER_LENGTH:] + '/' + fname)

    csses.append('/static/css/app.css')  # Always last.
    return csses


def appcache_hash():
    """Gets an version for the app itself.

    This is based on a hash of all the files in the appcache file.
    """
    return get_appcache_files_hashes()


def generate_production_files():
    global MINIFIED_PARTIALS  # there goes testability.
    scripts = get_all_script_paths()
    csses = get_all_css_paths()
    partials = get_all_partial_paths()

    minified_js = minify_js(scripts)
    minified_css = minify_css(csses)
    MINIFIED_PARTIALS = minify_partials(partials).decode('utf-8')

    with open(PRODUCTION_JS_FILE, 'w') as f:
        f.write(minified_js)

    with open(PRODUCTION_CSS_FILE, 'w') as f:
        f.write(minified_css)

# Setting up APPCACHE_FILES and DEBUG based settings.

APPCACHE_FILES.extend(get_files_in_dirs(
    os.path.join(STATIC_FOLDER, 'img'),
    os.path.join(STATIC_FOLDER, 'fonts'),
    os.path.join(STATIC_FOLDER, 'js', 'vendors')
))

APPCACHE_FILES = ['/meta.js'] + APPCACHE_FILES

if DEBUG:
    APPCACHE_FILES.extend(get_all_script_paths())
    APPCACHE_FILES.extend(get_all_partial_paths())
    APPCACHE_FILES.extend(get_all_css_paths())
else:
    print "Setting up production servers, standby...."
    import time
    start = time.time()
    generate_production_files()

    css_file = PRODUCTION_CSS_FILE[APP_FOLDER_LENGTH:]
    js_file = PRODUCTION_JS_FILE[APP_FOLDER_LENGTH:]

    APPCACHE_FILES.append(js_file)
    APPCACHE_FILES.append(css_file)

    # We override these methods here.
    def get_all_css_paths():
        return [PRODUCTION_CSS_FILE[APP_FOLDER_LENGTH:]]

    def get_all_script_paths():
        return [PRODUCTION_JS_FILE[APP_FOLDER_LENGTH:]]

    hashes = get_appcache_files_hashes()
    def appcache_hash():
        return hashes

    print "Setup done. Took: {} seconds".format(time.time() - start)
