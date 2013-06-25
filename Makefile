# Yay makefiles!

TEMPLATE_DIR=templates
JS_DIR=static/js/develop
PARTIALS_DIR=static/partials

LOCALES_DIR=locales

LOCALES_JS_FILE=static/js/locales.js

po:
	./scripts/extract.py $(TEMPLATE_DIR) $(JS_DIR) $(PARTIALS_DIR)

locale_js:
	./scripts/frompo.py -o $(LOCALES_JS_FILE) $(LOCALES_DIR)

server:
	python server.py

clean:
	find . -iname "*.pyc" -delete