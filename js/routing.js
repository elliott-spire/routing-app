// global vars
var REQUEST_COUNT = 0;
var RESPONSE_COUNT = 0;
var RESPONSES = [];

function calculateETA(knots, departure_time, api_response) {
    // calculate estimated time of arrival
    // if Speed and Departure Time are specified
    if (departure_time && departure_time != '' && knots && knots != '') {
        distance = api_response['distance']
        // convert knots to km/h since distance is in km
        km_h = knots * 1.852
        // time = distance/speed
        triptime_h = distance / km_h
        // add the trip's duration time
        // to the trip's departure time
        var eta = new Date();
        var depart = new Date(departure_time);
        eta.setHours( depart.getHours() + triptime_h );
        return eta.toUTCString(); //.strftime('%Y-%m-%d %H:%M:%S')
    } else {
        return api_response['eta'];
    }
}

// perform API request
function requestRoute(data, response_element, num) {
    // build URI parameters for API request
    var uri = 'https://api.sense.spire.com/routing'
    uri += '?port_start_unlocode=' + data['start'] +'&port_end_unlocode=' + data['end']
    uri += '&suez=' + data['suez'] + '&panama=' + data['panama']
    if (data['vesseltype'] != '') {
        uri += '&vessel_type=' + data['vesseltype']
    }
    if (data['latitude'] != '') {
        uri += '&latitude=' + data['latitude']
    }
    if (data['longitude'] != '') {
        uri += '&longitude=' + data['longitude']
    }
    console.log('GET', uri);
    var auth_header = {'Authorization': 'Bearer ' + window.TOKEN};
    fetch(uri, {headers: auth_header})
        .then((raw_response) => {
            // return the API response JSON
            // when it is received
            return raw_response.json();
        })
        .then((response) => {
            RESPONSE_COUNT += 1;
            console.log('Route returned:', response);
            var resp = response;
            var eta = calculateETA(data['speed'], data['departuretime'], resp);
            // output text to DOM
            response_element.getElementsByClassName('apiresp')[0].innerHTML = JSON.stringify(resp);
            var geojson = convertResponseToGeoJson(resp);
            response_element.getElementsByClassName('geojson_uf')[0].innerHTML = JSON.stringify(geojson);
            // output ETA text to DOM
            response_element.getElementsByClassName('calc_eta')[0].innerHTML = eta;
            // only proceed with visualization
            // and ETA calculation
            // if request response was valid
            if (geojson != {}) {
                // get distinct color using request index
                // so color order will always remain the same
                var color = getDistinctColor(num);
                // assign color to legend
                var legend = response_element.parentElement.getElementsByClassName('color')[0];
                legend.style.background = color;
                // store color to use in visualization
                geojson['features'][0]['properties']['color'] = color;
                // keep track of the response geojson
                RESPONSES.push(geojson);
            }
            // hacky alternative to using Promise.all()
            // that ensures all responses have returned
            // before we visualize the routes
            if (RESPONSE_COUNT == REQUEST_COUNT) {
                createMap(RESPONSES);
            }
        });
    // end of fetch promise
};

function requestAllRoutes() {
    // reset counts
    REQUEST_COUNT = 0;
    RESPONSE_COUNT = 0;
    // clear previous responses
    RESPONSES = [];
    // for each set of request parameters,
    // send a unique Routing API request
    var routes = document.getElementsByClassName('params');
    for (var i=0; i<routes.length; i++) {
        // keep track of how many routes are requested
        // so we can count responses before visualizing
        REQUEST_COUNT += 1;
        // get one set of request params
        var route = routes[i];
        // build request payload
        var data = {
            'start': route.getElementsByClassName('startport')[0].value,
            'end': route.getElementsByClassName('endport')[0].value,
            'suez': route.getElementsByClassName('suez')[0].value,
            'panama': route.getElementsByClassName('panama')[0].value,
            'vesseltype': route.getElementsByClassName('vesseltype')[0].value,
            'latitude': route.getElementsByClassName('latitude')[0].value,
            'longitude': route.getElementsByClassName('longitude')[0].value,
            'speed': route.getElementsByClassName('speed')[0].value,
            'departuretime': route.getElementsByClassName('departtime')[0].value
        }
        var response_element = route.parentElement.getElementsByClassName('response')[0];
        requestRoute(data, response_element, i);
    }
}

// add a new API request parameters form
function addRoute() {
    var params = "<div class='request'>\
        <button class='remove' onclick='deleteRoute(this)'>X</button>\
        <div class='params'>\
          <span><b>Start Port <i>UN/LOCODE</i>:</b> <input class='startport' type='text' value='FRMRS'></span><br>\
          <span><b>End Port <i>UN/LOCODE</i>:</b> <input class='endport' type='text' value='CAVAN'></span><br>\
          <span><b>Start Latitude</b> <i>(optional)</i>: <input class='latitude' type='number' min='-90' max='90'></span><br>\
          <span><b>Start Longitude</b> <i>(optional)</i>: <input class='longitude' type='number' min='-180' max='180'></span><br>\
          <span><b>Suez Canal</b> <i>(1=Yes || 0=No)</i>: <input class='suez' type='number' min='0' max='1' value='1'></span><br>\
          <span><b>Panama Canal</b> <i>(1=Yes || 0=No)</i>: <input class='panama' type='number' min='0' max='1' value='1'></span><br>\
          <span><b>Vessel Type</b> <i>(optional)</i>: <input class='vesseltype' type='text'></span><br>\
          <span><b>Vessel Speed in Knots</b> <i>(optional)</i>: <input class='speed' type='number' min='0' max='102' value='10'></span><br>\
          <span><b>Departure Time (UTC)</b> <i>(optional)</i>: <input class='departtime' type='text'></span><br>\
        </div>\
        <div class='response'>\
          Raw API Response: <pre class='apiresp output' contenteditable='true'></pre>\
          GeoJSON: <pre class='geojson_uf output' contenteditable='true'></pre>\
          Estimated Time of Arrival (UTC): <pre class='calc_eta output' contenteditable='true'></pre>\
        </div>\
        <div class='color'></div>\
    </div>";
    document.getElementById('routes').insertAdjacentHTML('beforeend', params);
    // setup Start Time datetimepicker
    $('.departtime').datetimepicker({
        value: window.TODAY,
        format:'Y-m-d H:i'
    });
}

// delete route from UI
function deleteRoute(self) {
    var request_element = self.parentElement;
    request_element.parentNode.removeChild(request_element);
}

// convert Routing API response to valid GeoJSON
function convertResponseToGeoJson(resp) {
    var geojson = {};
    var stringpoints = resp["route"];
    if (stringpoints != undefined) {
        // get rid of the unimportant syntax parts
        stringpoints = stringpoints.replace('LINESTRING','').replace('(','').replace(')','');
        var points = stringpoints.split(',');
        var coords = [];
        for (var i=0; i < points.length; i++) {
            var pair = points[i];
            // trim any trailing whitespace
            pair = pair.trim();
            // separate lon and lat via regexp
            // split on one (or more) space characters
            pair = pair.split(/\s+/);
            var lon = parseFloat(pair[0]);
            var lat = parseFloat(pair[1]);
            coords.push([lon,lat]);
        }
        var geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coords
                    }
                }
            ]
        };
    } else {
        console.log('Failure: API response does not contain a route.')
    }
    return geojson;
}
