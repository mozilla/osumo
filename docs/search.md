Searching
=========

Searching is an important feature to osumo. There are a lot of articles in the 
database and therefore we need a way to search in the app.

Requirements
------------

 - Searching needs to be able run entirely offline. This means that the entire 
   search engine must be implemented exclusively in JavaScript (we can cheat 
   though).
 - Searching needs to be *relatively* fast and *relatively* good for offline on
   something a Firefox OS device. Since Firefox OS devices are fairly low power,
   the ability to search through the data fast is an absolute must. The quality
   of these results do not need to be as good as this search engine is no
   ElasticSearch.
 - All cached data that the search needs must be able to store into IndexedDB.
   There are no alternatives, unfortunately.

With these requirements in mind, the proposed implementations relies on a 
reverse index. To cheat, we compute the index on the server so that the client
only needs a minimum amount of effort looking up the appropriate documents.
