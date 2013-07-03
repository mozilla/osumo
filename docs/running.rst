.. _running-chapter:

=======
Running
=======

To run the app right now, you will need to not only run this, but run a branch
of kitsune that lives `here <https://github.com/shuhaowu/kitsune/tree/offline-sumo>`_.
You can either apply the patch in your source tree or check out from there and
setup kitsune.

Requirements
============

You will need a machine that has git, Python 2.7, and pip. This has currently
only been tested on Linux (Xubuntu 13.04).

Setup
=====

After you have git and Python 2.7 (no less or greater), clone the repository:

::

  $ git clone https://github.com/mozilla/osumo.git
  $ cd osumo

It is highly recommended that you setup a virtual environment via your
favourate method. After that, install the requirements:

::

  $ pip install requirements.txt

You will need a ``settings_local.py`` file. This file can override things in
``settings.py``. Specifically, we need to override the some paths for
development. A good template is as follows:

::

  DEBUG = True

  DEPLOY_IP = '127.0.0.1'
  DEPLOY_PORT = 5291

  BASE_URL = 'http://localhost:5291/'
  SUMO_URL = 'http://localhost:8000/'

For the above, please note that ``BASE_URL`` is the URL that you want to view
your app in (it will error if you view it from a different URL!) and
``SUMO_URL`` is either an instance of kitsune running on your computer or if
it is deployed, you can leave it out.

To finally run the app:

::

  $ python server.py

Follow the link you set as ``BASE_URL`` in your browser to view.

Generating locales
==================

To work with locales, you need make installed on your computer. If you don't
want that, you can take a look at the ``Makefile`` to see the commands for
generation.

If you worked on the interface and added some new strings, it is a good idea to
regenerate the po files for translation. You can do that by going to the osumo
root directory and run:

::

  $ make po

If you did some translation in the po files and need to update that back into
the app, run:

::

  $ make locale_js

Deployment
==========

Right now osumo is deployed onto Stackato via gunicorn. In order to do this,
you need to setup a new osumo instance via Stackato and run:

::

  $ ./deploy.sh

That should take care of deployment on Stackato.

One thing to note is that you probably need a ``settings_local.py`` to override
the setting for ``DEBUG`` and ``BASE_URL``. The ``stackato.yml`` file currently
ignores that file so you might want to delete it from the ignore pattern.

If you want to deploy on other platforms, it should be fairly simple as you
can install all the dependencies and run ``gunicorn -b <IP>:<PORT> osumo:app``.

