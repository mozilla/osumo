DEBUG = False

DEPLOY_IP = '127.0.0.1'
PORT = 5291

try:
    from devsettings import *
except ImportError:
    pass