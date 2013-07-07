.. _database-chapter:

========
Database
========


All data is stored in IndexedDB. The different databases and object stores that
are used are listed here:

Databases
---------

:Name:
    osumo-settings
:Purpose:
    To store metadata, settings data, and locales
:Stores:
    meta
:Notes:
    This database will always have a version of 1 for now. Changing this should
    be okay but let's try to avoid doing that.

------------------

:Name:
    osumo
:Purpose:
    The main database (storing documents, everything necessary to display).
:Stores:
    locales, docs, topics, indexes, images, bundles
:Notes:
    All data that actually matters lives in this database.

Object Stores
-------------

**Meta store under osumo-settings**

:Name:
    meta
:Parent:
    osumo-settings
:Purpose:
    To store some metadata about the app.
:Key path:
    version (int)
:Schema:

    ::

      {
        version: the version of the app (int),
        locale: the locale code that's the default display locale (str),
        lastUpdated: last time update was checked for articles in unix time stamp as a second.
      }

----------------------------

**Locales store under osumo**

:Name:
    locales
:Parent:
    osumo
:Purpose:
    To store the locales downloaded and the topics/products they have.
:Key path:
    key (str)
:Schema:

    ::

      {
        key: locale code (str),
        name: The display name (str),
        products: [
          {
            slug: product slug (str),
            name: product display name (str)
          }
        ],
      }

**Topics store under osumo**

:Name:
    topics
:Parent:
    osumo
:Purpose:
    To store the list of topics and the associated articles for that topic.
:Key path:
    key (str)
:Schema:

    ::

      {
        key: locale + "~" + product slug + "~" + topic slug (str),
        name: topic display name (str),
        product: product slug (str),
        children: [
          subtopic slug (str)
        ],
        docs: [
          doc slug (str)
        ],
        slug: topic slug
      }
:Index:
    ``product`` is indexed by the field ``by_product``

**Docs store under osumo**

:Name:
    docs
:Parent:
    osumo
:Purpose:
    To store the documents.
:Key path:
    key (str)
:Schema:

    ::

      {
        key: locale + "~" + doc slug (str),
        id: unique unique id from db (int),
        html: the html content (str),
        slug: document slug (str),
        title: document title (str),
        updated: the last time the document has been updated as seconds since UNIX epoch (int),
        archived: archived (boolean/undefined)
      }
:Index:
    ``id`` is indexed by the field ``by_id``

**Indexes store under osumo**

:Name:
    indexes
:Parent:
    osumo
:Purpose:
    To store the index for offline search.
:Key path:
    key (str)
:Schema:

    ::

      {
        key: locale + "~" + product slug (str),
        index: {
          word: [
            [doc id (int), score (float)]
          ]
        }
      }
:Notes:
    More on how this works in the :ref:`offlinesearch-chapter` section.

**Bundles store under osumo**

:Name:
    bundles
:Parent:
    osumo
:Purpose:
    To store the bundles and their hashes (version)
:Key path:
    None. Bundle key is the key (locale + '~' + product slug)
:Schema:
    None. A simple string is stored and that is the hash of the current
    articles. If this hash differs from the one returned by the server, an
    update is needed.
