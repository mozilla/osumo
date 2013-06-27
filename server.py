from osumo import app

from settings import *


def main():
    if DEBUG:
        app.run(debug=True, host="", port=DEPLOY_PORT)
    else:
        app.run(debug=True, host="", port=DEPLOY_PORT)

if __name__ == '__main__':
    main()
