import os
import subprocess

DEBUG = False

DEPLOY_IP = '127.0.0.1'
DEPLOY_PORT = 5291

BASE_URL = 'http://osumo.paas.allizom.org/'
SUMO_URL = 'http://fakesumo.paas.allizom.org/'

if os.path.isfile('commit.txt'):
  with open('commit.txt') as f:
    COMMIT_SHA = f.read().strip()
else:
  COMMIT_SHA = subprocess.check_output("git rev-parse HEAD", shell=True).strip()
