Client-side Data Structure
==========================

This doc explains how the client-side database (in indexeddb) should work.

Requirements
------------

Since one of the primary target of this app is Firefox OS, it means that we
need a data structure that is efficient to retrieve but yet uses not a lot of
RAM.

The data given is highly structure, we need to essentially "flatten" it in 
order for store it into IndexedDB. The data is very tree like as illustrated:

    locale -> products -> topic [-> subtopic] -> article
    en-US -> Firefox OS -> Fix Problems -> Firefox OS FAQ

Note that the only form of query IndexedDB supports is a key based query.

Database "Schemas"
------------------

Several databases are needed in order for us to store everything in an efficient
and convinient manner. Here are the databases we need to create and populate.

### Meta DB ###

**Database name**: "osumo-meta"

**Description**: A database that holds the meta information about the app. Such
                 as if it is installed, what locales we have downloaded, the
                 version/git commit of the app installed and so forth.

**Schema**

    Key: version/git commit sha
    Document: {
      installed: boolean,
      locales: [list of locale ids],
      lastUpdated: time,
      settings: {
        // this here is for the app settings. TBD.
      }
    }


### Category DB ###

**Database name**: For different things it's different. See below

**Description**: A database that holds information on a category (could be 
                 locale, products, topics, or otherwise)

**Schema**

    Key: Depends. See below
    Document: {
      name: name of the category,
      children: [children db names],
      docs: [doc ids], // This is optional 
      settings: {
          // tbd
      }
    }

#### Locale DB ####

(This uses the format of Category DB)

**Database name**: locale id

 - `name` is the name of the locale
 - `children` holds ids of all the downloaded product contents of this locale.
   - As an example, if I downloaded both firefox os and firefox for android, it
     would be a list of `["mobile", "firefox-os"]`
 - `docs` is undefined.

#### Topics DB ####

(This uses the format of Category DB)

**Database name**: locale id + delimiter + product id + n(delimiter + topic id)

(Note the n means there are n of those, as there could be subtopics)

 - `name` is the name of the topic in the appropriate locale
 - `children` holds the db names of all the subtopics if any exists
 - `docs` is a list of docs id

### Docs DB ###

(This one is pretty unstable)

**Database name**: "docs"

**Description**: Stores all documents, no matter which language or product.

**Schema**

    Key: document id
    Document: {
      title: title,
      summary: summary,
      slug: slug,
      update: last updated time,
      html: the html (note: must be safe!!)
      images: {
          // ?? Do we want click to play images or all downloaded images?
      }
    }

### Image DB ###

(This one is incomplete)

**Database name**: "images"

**Description**: We need to store the images somewhere! Might have to base64
                 encode them

**Schema**

    Key: image path
    Document: {
        data: whatever format..
    }

### Index DB ###

(This one is incomplete)

**Database name**: locale + delimiter + "indexes"

**Description**: We need to get an index for search. This is what this is for

**Schema**

    unknown
