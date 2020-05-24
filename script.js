// const auth = firebase.auth()
// const logout = document.querySelector('#logout');

// logout.addEventListener('click', (e) => {
//     e.preventDefault();
//     auth.signOut().then(() =>{
//       db.collection("user-info").doc(userID).delete().then(function() {
//           console.log("Document successfully deleted!");
//       }).catch(function(error) {
//           console.error("Error removing document: ", error);
//       });
//     })
//   })

const fAuth = firebase.auth();
const db = firebase.firestore(app);
const fStore = firebase.firestore();
var watchID;
var geoLoc;
var userID;
const createMap = ({
  lat,
  lng
}) => {
  return new google.maps.Map(document.getElementById('map'), {
      center: {
          lat,
          lng
      },
      zoom: 15
  });
};

const createMarker = ({
  map,
  position
}) => {
  return new google.maps.Marker({
      map,
      position
  });
};

const getCurrentPosition = ({
  onSuccess,
  onError = () => {}
}) => {
  if ('geolocation' in navigator === false) {
      return onError(new Error('Geolocation is not supported by your browser.'));
  }

  return navigator.geolocation.getCurrentPosition(onSuccess, onError);
};

const getPositionErrorMessage = code => {
  switch (code) {
      case 1:
          return 'Permission denied.';
      case 2:
          return 'Position unavailable.';
      case 3:
          return 'Timeout reached.';
      default:
          return null;
  }
}

const trackLocation = ({
  onSuccess,
  onError = () => {}
}) => {
  // Omitted for brevity

  return navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
  });
};

let firestore = firebase.firestore();


function take_location() {


}

function errorHandler(err) {
  console.log("Error");
}

function measure(lat1, lon1, lat2, lon2){  
    var R = 3958.8; // Radius of the Earth in miles
    var rlat1 = lat1 * (Math.PI/180); // Convert degrees to radians
    var rlat2 = lat2 * (Math.PI/180); // Convert degrees to radians
    var difflat = rlat2-rlat1; // Radian difference (latitudes)
    var difflon = (lon2 - lon1) * (Math.PI/180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
    var e = d * 1609; //convert miles to meter
    return e;
}

function initMap() {

    const initialPosition = {
      lat: 39.95,
      lng: -75.16
    };
    /*Create Map and Marker*/
    const map = createMap(initialPosition);
    const marker = createMarker({
      map,
      position: initialPosition
    });

    var card = document.getElementById('pac-card');
    var input = document.getElementById('pac-input');
    var types = document.getElementById('type-selector');
    var strictBounds = document.getElementById('strict-bounds-selector');

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

    var autocomplete = new google.maps.places.Autocomplete(input);

    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo('bounds', map);

    // Set the data fields to return when the user selects a place.
    autocomplete.setFields(
        ['address_components', 'geometry', 'icon', 'name']);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);

  autocomplete.addListener('place_changed', function() {
      infowindow.close();
      //   marker.setVisible(false);
      var place = autocomplete.getPlace();
      if (!place.geometry) {
          // User entered the name of a Place that was not suggested and
          // pressed the Enter key, or the Place Details request failed.
          window.alert("No details available for input: '" + place.name + "'");
          return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
      } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17); // Why 17? Because it looks good.
      }
      marker.setPosition(place.geometry.location);
      
        var latt = place.geometry.location.lat();
        var longg = place.geometry.location.lng();
        console.log(latt);
        console.log(longg);
        fStore.collection("user_info").doc(userID).set({
            latitude: latt,
            longitude: longg
        });


 
      
      //Draw Circle
      var cityCircle = new google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          map: map,
          center: place.geometry.location,
          radius: 1000,
      });
      marker.setVisible(true);
      
      setupClickListener('changetype-all', []);
      setupClickListener('changetype-address', ['address']);
      setupClickListener('changetype-establishment', ['establishment']);
      setupClickListener('changetype-geocode', ['geocode']);

      document.getElementById('use-strict-bounds')
          .addEventListener('click', function() {
              console.log('Checkbox clicked! New state=' + this.checked);
              autocomplete.setOptions({
                  strictBounds: this.checked
              });
          });

      var address = '';
      if (place.address_components) {
          address = [
              (place.address_components[0] && place.address_components[0].short_name || ''),
              (place.address_components[1] && place.address_components[1].short_name || ''),
              (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
      }

      infowindowContent.children['place-icon'].src = place.icon;
      infowindowContent.children['place-name'].textContent = place.name;
      infowindowContent.children['place-address'].textContent = address;
      infowindow.open(map, marker);
  });

  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  function setupClickListener(id, types) {
      var radioButton = document.getElementById(id);
      radioButton.addEventListener('click', function() {
          autocomplete.setTypes(types);
      });
  }

  getCurrentPosition({
      onSuccess: ({
          coords: {
              latitude: lat,
              longitude: lng
          }
      }) => {
          marker.setPosition({
              lat,
              lng
          });
          map.panTo({
              lat,
              lng
          });
          fStore.collection("User").doc(userID).update({
            latitude: lat,
            longitude: lng
          })
      },
      onError: err =>
          alert(`Error: ${getPositionErrorMessage(err.code) || err.message}`)
  });

  trackLocation({
      onSuccess: ({
          coords: {
              latitude: lat,
              longitude: lng
          }
      }) => {
          marker.setPosition({
              lat,
              lng
          });
          map.panTo({
              lat,
              lng
          });

      },
      onError: err =>
          alert(`Error: ${getPositionErrorMessage(err.code) || err.message}`)
  });
    
    if (navigator.geolocation) {
          geoLoc = navigator.geolocation;
          watchID = geoLoc.watchPosition(function showLocation(position) {
              var user_list = [];
              var user_list2 = [];
              var lat = position.coords.latitude;
              var lng = position.coords.longitude;
              var today = new Date();
              var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
              var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
              var dateTime = date+' '+time;

                firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log(user.uid);
                    var userID = user.uid;
                } else {
                    console.log("Cannot get userid")
                }
                });

              fStore.collection("User").doc(userID).update({
                latitude: lat,
                longitude: lng,
                time: dateTime
              })

                firebase.firestore().collection("User").get().then(function(querySnapshot) {
                    querySnapshot.forEach(function(doc) {
                        if (doc.id != userID){
                            // doc.data() is never undefined for query doc snapshots
                            user_list.push(doc.data());
                        }
                });

                console.log("Here is length of list 1: " + user_list.length);

                firebase.firestore().collection("user_info").doc(userID).get().then(function(querySnapshot) {
                        // doc.data() is never undefined for query doc snapshots
                        user_list2.push(querySnapshot.data());

                console.log("Here is lenthg of list 2: " + user_list2.length);
                
                var num_people = 0
                for (var i = 0; i < user_list.length; i++) {
                    //console.log(typeof user_list[0].latitude);
                    var latt = parseFloat(user_list[i].latitude);
                    var longg = parseFloat(user_list[i].longitude);
                    var marker = new google.maps.Marker({
                        map: map,
                        position: {lat: latt, lng: longg},
                        title: "Your Location"
                    });

                    var latitude = user_list2[0].latitude;
                    console.log(latitude);
                    var longitude = user_list2[0].longitude;
                    console.log(longitude);
                    var distance_marker = measure(latitude, longitude, latt, longg);
                    if (distance_marker < 1000){
                        num_people ++;
                        console.log(latitude);
                        console.log(longitude);
                        console.log(latt);
                        console.log(longg);
                        if (num_people > 0){
                            // alert("Too crowded, you should not come here!")
                            // console.log(num_people.length);
                            var distance_between = measure(latitude, longitude, latt, longg);
                            console.log("Distance in range: " + distance_between);
                        }
                        else{
                            alert("You can come!")
                        }
                        console.log(num_people);
                    }
                    else{
                        var distance_meter = measure(latitude, longitude, latt, longg);
                        console.log(latitude);
                        console.log(longitude);
                        console.log(latt);
                        console.log(longg);
                        console.log("Distance: " + distance_meter);
                        console.log(num_people);
                    }
                }

            });
        });
    }, errorHandler,  {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
}

}
function SignOut(){
    
}