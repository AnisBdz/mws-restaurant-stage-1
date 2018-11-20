let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiYW5pc2JkeiIsImEiOiJjams4aGQ5czMxYmhpM3BwMDJhMDZqa2hjIn0.Mviiiw7RzERs2RdZxeQt1A',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }

      DBHelper.sendDefferedReviews()
      .then(() => {
        return DBHelper.fetchReviewsByRestaurantID(id).then(reviews => {
          self.restaurant.reviews = reviews
        })
      })

      .then(() => fillRestaurantHTML())

      .catch(e => console.log('Could not load reviews', e))

      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imageSource = DBHelper.imageUrlForRestaurant(restaurant).split('.')[0];
  const image = document.getElementById('restaurant-img');

  image.innerHTML = `
    <source media="(max-width: 350px)" srcset="${imageSource}-s_1x.webp 1x, ${imageSource}-m_2x.webp 2x"/>
    <img src="${imageSource}-m_2x.webp" alt="Photo of ${restaurant.name}">
  `;

  image.setAttribute('alt', `Photo of ${restaurant.name}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Show add review modal
 */
showReviewModal = () => {
  let modal = document.getElementById('review-modal')

  modal.classList.remove('hidden')
  modal.removeAttribute('aria-hidden')

}
hideReviewModal = () => {
  let modal = document.getElementById('review-modal')
  modal.classList.add('hidden')
  modal.setAttribute('aria-hidden', true)
}

submitReview = () => {
  const name = document.getElementById('review-name').value
  const comments = document.getElementById('review-text').value
  const rating = document.getElementById('review-rating').value

  // check input
  if (name == '' || comments == '') {
    return alert('Please provide all input.')
  }

  DBHelper.sendReview({
    name, rating, comments, restaurant_id: self.restaurant.id
  })

  .then(review => {
    if (!review) {
      alert('There is no available internet connection at the moment, your review is saved and will be submited later')
      hideReviewModal()
      addEventListener("online", function () {
        console.log('You are now online...')
        DBHelper.sendDefferedReviews()
        .then(reviews => {
          console.log(reviews)
          for (let i in reviews) self.restaurant.reviews.push({ ...reviews[i], createdAt: new Date()})
          fillReviewsHTML()
        })
      })
    }

    else {
      alert('Review submited successfully')
      self.restaurant.reviews.push(review)
      fillReviewsHTML()
      hideReviewModal()
    }
  })

  .catch(e => console.log(e))
}

updateStars = (e) => {
  let index = parseInt(e.target.id.split('-').pop())

  for (let i = 1; i <= index; i++) {
    document.getElementById(`star-${i}`).innerHTML = '★'
  }

  for (let i = index + 1; i <= 5; i++) {
    document.getElementById(`star-${i}`).innerHTML = '☆'
  }

  document.getElementById('review-rating').value = index
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  document.getElementById('reviews-container').innerHTML = `<ul id="reviews-list"></ul>`
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  const addReview = document.createElement('button')
  addReview.classList.add('add-review')
  addReview.classList.add('btn')
  addReview.innerHTML = '+ Add Review'
  addReview.addEventListener('click', showReviewModal)
  document.getElementById('close-review-modal').addEventListener('click', hideReviewModal)
  document.getElementById('submit-review').addEventListener('click', submitReview)

  for (let i = 1; i <= 5; i++) {
    document.getElementById(`star-${i}`).addEventListener('click', updateStars)
  }

  container.appendChild(addReview)

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = "name"
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.className = "date"

  let d = new Date(review.createdAt)
  let m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  date.innerHTML = m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.className = 'rating-stars'
  rating.innerHTML = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  rating.title = review.rating + '/5'
  rating.setAttribute('aria-label', `Rating: ${review.rating}/5`)
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'comments'
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
