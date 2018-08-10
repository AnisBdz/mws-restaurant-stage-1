const cacheName = 'restaurants-v4';

// when the service worker is installed
self.addEventListener('install', e => {
  e.waitUntil(caches.open(cacheName).then(function (cache) {
		// cache page
		cache.addAll([
      './',
      'index.html',
      'restaurant.html',
      'js/dbhelper.js',
      'js/main.js',
      'js/restaurant_info.js',
      'css/styles.css',
      'data/restaurants.json',
      'https://fonts.googleapis.com/css?family=Roboto:400',
      'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu72xKOzY.woff2',
      'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
      'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
      'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
      'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
      'https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png'
    ]);
	}));
})

// when the serve worker is activated
self.addEventListener('activate', e => {
  e.waitUntil(
    // delete all previous caches
  	caches.keys().then(function (names) {
  		return Promise.all(names.filter(function (name) {
  			return name.startsWith('restaurants-') && name != cacheName;
  		}).map(function (name) {
  			return caches.delete(name);
  		}));
    })
  );
})

// when fetching assets
self.addEventListener('fetch', e => {

  // if restaurant.html is requested dismiss query string
  if (e.request.url.includes('restaurant.html')) return e.respondWith(caches.match('restaurant.html'))

  // respond with cache first
	e.respondWith(caches.match(e.request).then(function (response) {
    // if asset is cached serve it
    if (response) return response

    // get required asset
    return fetch(e.request).then(response => {
      let cloned

      // if image cache it
      if (/\.(jpg|gif|png)/.test(e.request.url)) {
        // clone first
        cloned = response.clone()

        // open cache and add image to it
        caches.open(cacheName).then(cache => cache.put(e.request.url, cloned))
      }

      // serve response
      return response
    })

    // in case of any error
    .catch(err => {
      // console.log('Could not load asset', err)

      // if the asset is a restaurant image
      if (e.request.url.includes('/img/')) {
        // Fallback to other dimension images
        if (e.request.url.includes('-s_1x')) return caches.match(e.request.url.replace('-s_1x', '-m_2x'))
        else return caches.match(e.request.url.replace('-m_2x', '-s_1x'))
      }

    })
	}));
})
