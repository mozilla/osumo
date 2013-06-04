DEBUG = False

DEPLOY_IP = '127.0.0.1'
PORT = 5291

BASE_URL = 'http://osumo.paas.allizom.org/'
SUMO_URL = 'https://support.mozilla.org/'

try:
  from devsettings import *
except ImportError:
  pass