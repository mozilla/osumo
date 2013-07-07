.. _offlinesearch-chapter:

==============
Offline Search
==============

Searching is a feature that we need offline as it is an important way to find
articles. Before designing the search engine, several key constraints are
considered:

- Search needs to run entirely offline.
- Search needs to be *reasonably good* and it should be able to handle
  multi-word queries. This means ranking will be somewhat important.
- Search needs to be *reasonably fast* on a low powered device such as a
  Firefox OS phone.
- Index data must be stored offline (if any) and it must be stored into
  indexeddb as it is the only viable option.

To address these issues, the following approach is taken:

- The indexing operation is done entirely server side. The client side only
  needs to perform the minimum amount of computation.
- The index chosen is a reverse hashtable and the corpus is just the titles and
  summaries of articles. They usually have a fairly good description of what
  the article is about. A reverse hashtable is also easily serialized into JSON
  and stored into IndexedDB.

We do not provide (yet!):

- Stemming: it is difficult to provide stemming to many languages uniformly.
- Aliasing characters such as e to é: This may be added in soon.

Index Structure
---------------

The index chosen is a reverse hashtable. That is, every word is mapped to a
list of documents that it occurs in. In addition, there is a score that each
word has for each document that it appears in. The higher the score, the more
important that word is.

The score is computed based on an algorithm called
`TF-IDF <http://en.wikipedia.org/wiki/Tf%E2%80%93idf>`_. TFIDF is an algorithm
that scores the importance of each word in an article given a corpus of many
articles. It effectively extracts the most important words in any article. For
us, we multiply the scores for the terms of the title by 1.2, effectively
weighting it more than the summary.

For each search term, we go through the index and finds the list of document
and scores the term is associated with. We add up the score for each article
and sorts them. The document with the highest score will be displayed at the
top and the document with the lowest score will be displayed at the bottom.

As an example, if we have the following index:

    ::

      {
        "bookmarks": [1029, 2.3, 1000, 1.5],
        "firefox": [1000, 0.9, 1010, 0.7, 1111: 0.8]
      }

and if we searched for the term "firefox bookmarks", the following is computed:

    ::

      [
        [1000, 2.4], // 1.5 + 0.9 from bookmarks and firefox
        [1029, 2.3],
        [1111, 0.8],
        [1010, 0.7]
      ]

These documents will be displayed with that order.