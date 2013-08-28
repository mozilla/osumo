from osumo import app


def main():
    app.run(debug=True, host="", port=app.config['DEPLOY_PORT'])

if __name__ == '__main__':
    main()
