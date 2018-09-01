/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   *  Open the idb store
   */
  static openDatabase() {
    return idb.open('mws-restaurant', 1, db => {

      switch (db.oldVersion) {
        case 0:
          let restaurantStore = db.createObjectStore('restaurants', { keyPath: 'id' })
          let cuisineStore = db.createObjectStore('cuisines', { unique: true})
          let neighborhoodStore = db.createObjectStore('neighborhoods', { unique: true})
      }

    })

    // make sure restaurants are fetched
    .then(db => {
      // if fetched we are done
      if (DBHelper.fetched) return db

      // else
      return new Promise((resolve, reject) => {
        DBHelper.fetchRestaurants((e) => {
          // in case of errors
          if (e) return reject(e)

          // register as fetched
          DBHelper.fetched = true

          // return db
          resolve(db)
        }, Promise.resolve(db))
      })
    })
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, db) {

    // open db if not passed
    if (!db) db = DBHelper.openDatabase()

    // open store
    db.then(db => {
      // get all restaurants
      return db.transaction('restaurants').objectStore('restaurants').getAll()
      .then(restaurants => {

        // if not enough restaurants, request full list
        if (restaurants.length < 10)
          // fetch
          return fetch(DBHelper.DATABASE_URL)

          // convert to json
          .then(data => data.json())

          // insert data to db
          .then(restaurants => {
            // insert each restaurant
            const tx = db.transaction('restaurants', 'readwrite');
            const os = tx.objectStore('restaurants');

            restaurants.map(r => os.put(r))

            // promise is done when all inserted
            return tx.complete.then(() => restaurants);

          })

          // insert cuisines and neighborhoods
          .then(restaurants => {

            const cuisine_tx    = db.transaction('cuisines', 'readwrite');
            const cuisine_store = cuisine_tx.objectStore('cuisines')
            restaurants.forEach(r => cuisine_store.put(r.cuisine_type, r.cuisine_type))

            const neighborhood_tx    = db.transaction('neighborhoods', 'readwrite');
            const neighborhood_store = neighborhood_tx.objectStore('neighborhoods')
            restaurants.forEach(r => neighborhood_store.put(r.neighborhood, r.neighborhood))

            return Promise.all([cuisine_tx.complete, neighborhood_tx.complete])
            .then(() => restaurants)


          })

        // return restaurants form idb
        return restaurants

      })

    })


    .then(restaurants => callback(null, restaurants))
    .catch(e => callback(e, null))
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {

    // open database
    DBHelper.openDatabase()

    // get by id
    .then(db => db.transaction('restaurants').objectStore('restaurants').get(id))

    // callback
    .then(restaurant => {
      // if not existing try fetching the restaurant
      if (!restaurant)
        return fetch(`${DBHelper.DATABASE_URL}/${id}`)
        .then(data => data.json())
        .then(restaurant => callback(null, restaurant))

      // success
      callback(null, restaurant)
    })

    // catch errors
    .catch(e => callback(e, null))
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {

    let restaurants = []

    // open database
    DBHelper.openDatabase(db => {

      // loop through items
      const tx = db.transaction('restaurants');
      tx.objectStore('restaurants').openCursor().then(function cursorIterate(cursor) {
        if (!cursor) return;

        // filter results
        if (cursor.value.cuisine_type == cuisine) restaurants.push(cursor.value)

        return cursor.continue().then(cursorIterate);
      });

      return tx.complete
    })

    // callback
    .then(() => callback(null, restaurants))

    // in case of any error
    .catch(e => callback(e, null))
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {

    let restaurants = []

    // open database
    DBHelper.openDatabase(db => {

      // loop through items
      const tx = db.transaction('restaurants');
      tx.objectStore('restaurants').openCursor().then(function cursorIterate(cursor) {
        if (!cursor) return;

        // filter results
        if (cursor.value.neighborhood == neighborhood) restaurants.push(cursor.value)

        return cursor.continue().then(cursorIterate);
      });

      return tx.complete
    })

    // callback
    .then(() => callback(null, restaurants))

    // in case of any error
    .catch(e => callback(e, null))
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {

    let restaurants = []

    // open database
    DBHelper.openDatabase()


    .then(db => {

      // loop through items
      const tx = db.transaction('restaurants');
      tx.objectStore('restaurants').openCursor().then(function cursorIterate(cursor) {
        if (!cursor) return;


        // filter results
        if ( (cursor.value.cuisine_type == cuisine      || cuisine == 'all')
          && (cursor.value.neighborhood == neighborhood || neighborhood == 'all'))

          restaurants.push(cursor.value)

        return cursor.continue().then(cursorIterate);
      });

      return tx.complete
    })

    // callback
    .then(() => callback(null, restaurants))

    // in case of any error
    .catch(e => callback(e, null))
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // open database
    DBHelper.openDatabase()

    // get by neighborhood index
    .then(db => db.transaction('neighborhoods').objectStore('neighborhoods'))

    // get keys
    .then(index => index.getAll())

    // callback
    .then(keys => callback(null, keys))

    // in case of error
    .catch(e => callback(e, null))
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // open database
    DBHelper.openDatabase()


    // get by neighborhood index
    .then(db => db.transaction('cuisines').objectStore('cuisines'))

    // get keys
    .then(index => index.getAll())

    // callback
    .then(keys => callback(null, keys))

    // in case of error
    .catch(e => callback(e, null))
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}
