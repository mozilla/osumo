.. _overview-chapter:

========
Overview
========

Offline SUMO is an app developed for Firefox OS (and other platforms if so
desired) that serves SUMO contents offline. This document is written for
developers who wish to hack on the app. As of right now, the offline SUMO's
code lives under https://github.com/mozilla/osumo.

Offline SUMO is to be ran entirely offline. The primary target is a low powered
device such as a Firefox OS phone. This requirement subject the app to some
constraints:

- App needs to be developed to run offline entirely, with the exception of the
  initial installation.
- App needs to run reasonably fast on a low powered device such as a Firefox OS
  phone.
- App needs to be mobile friendly.

The following choices are made to accomodate these constraints:

- App is written as a single page application with Angular.JS. Data is to
  be downloaded from SUMO's offline API and stored into IndexedDB. This
  resolves most of the needs for a reasonably fast, offline only app. The
  caching of HTML, CSS, and JavaScript files are done via appcache.
- The app is to mirror the current mobile design. However as of this point the
  app only has an experimental Foundation based theme.
- Most of the heavy lifting of the database generation is done on the server.
  The data returned from the server is to be directly stored into IndexedDB
  with no further modifications.

App Structure
=============

The client side has a small server that serves HTML for essentially all urls.
The same HTML will be served and Angular.JS will take care of rendering the UI.
The server also serves all the static files and builds the JavaScript and other
files that needs to be generated.

Most of the interesting code lives under static/js/develop/ and static/partials/.