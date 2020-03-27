var ENABLE_FORECAST = false;
var WEATHER_LAT = 0;
var WEATHER_LON = 0;
// get the current URL parameters
var urlParams = new URLSearchParams(window.location.search);

// change the time format
function get_vega_time(d) {
	var datestring = d.split("T");
	var time = datestring[1].split(",")[0].split("+")[0];
	return datestring[0] + ' ' + time;
}

function getPointForecast(coordinate, time_bundle) {
    if (coordinate != null) {
        var lat = Number(coordinate[1]);
        var lon = Number(coordinate[0]);
        if (lat < -90) {
            lat = lat + 180;
        } else if (lat > 90) {
            lat = lat - 180;
        }
        if (lon < -180) {
            lon = lon + 360;
        } else if (lon > 180) {
            lon = lon - 360;
        }
        WEATHER_LAT = lat;
        WEATHER_LON = lon;
    }
    document.getElementById("forecast_point_label").innerHTML = 'Latitude: ' + WEATHER_LAT + '<br>Longitude: ' + WEATHER_LON;
    console.log("Getting Weather Point Forecast for:", WEATHER_LAT, WEATHER_LON)
    // build the route for the API call using the `lat` and `lon` URL parameters
    var url = "https://api.wx.spire.com/forecast/point?lat=" + WEATHER_LAT + "&lon=" + WEATHER_LON;
    url += "&time_bundle=" + time_bundle;
    // hard code maritime bundle for now
    url += "&bundles=maritime";
    // only support Maritime for now
    // since this is the Maritime Routing App
    var BASIC = false;
    var MARITIME = true;

    fetch(url, {headers:{'spire-api-key':window.TOKEN}})
        .then((rawresp) => {
            return rawresp.json();
        })
        .then((response) => {
            console.log(response);

            var tempscale = urlParams.get('tempscale');
            if (tempscale == null) {
                tempscale = 'C'
            } else {
                tempscale = tempscale.toUpperCase();
            }

            // initialize arrays to store output data

            // basic
            var air_temp_vals = [];
            var dew_point_temp_vals = [];
            var wind_speed_vals = [];
            var wind_dir_vals = [];
            var rel_hum_vals = [];
            var air_press_sea_level_vals = [];
            var precip_vals = [];
            var wind_gust_vals = [];
            // maritime
            var sea_surface_temp_vals = [];
            var wave_height_vals = [];
            var ocean_currents_speed_vals = [];
            var ocean_currents_dir_vals = [];

            // iterate through the API response data
            // and build the output data structures
            for (var i = 0; i < response.data.length; i++) {

                var valid_time = response.data[i].times.valid_time;
                var valid_time_vega_format = get_vega_time(valid_time);

                if (BASIC) {
                    // add Basic Bundle variables
                    air_temp_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': get_temperature(response.data[i].values.air_temperature, tempscale)
                    });
                    dew_point_temp_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': get_temperature(response.data[i].values.dew_point_temperature, tempscale)
                    });
                    wind_speed_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': get_speed_from_u_v(
                            response.data[i].values.eastward_wind,
                            response.data[i].values.northward_wind
                        ),
                    });
                    wind_dir_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': get_direction_from_u_v(
                            response.data[i].values.eastward_wind,
                            response.data[i].values.northward_wind
                        ),
                    });
                    rel_hum_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': response.data[i].values.relative_humidity
                    });
                    air_press_sea_level_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': response.data[i].values.air_pressure_at_sea_level
                    });
                    wind_gust_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': response.data[i].values.wind_gust
                    });
                    precip_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': parse_precipitation(response.data, i)
                    });
                }

                if (MARITIME) {
                    // add Maritime Bundle variables

                    sea_surface_temp_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': get_temperature(response.data[i].values.sea_surface_temperature, tempscale)
                    });
                    wave_height_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': response.data[i].values.sea_surface_wave_significant_height
                    });
                    ocean_currents_speed_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': get_speed_from_u_v(
                            response.data[i].values.eastward_sea_water_velocity,
                            response.data[i].values.northward_sea_water_velocity
                        ),
                    });
                    ocean_currents_dir_vals.push({
                        'Time': valid_time_vega_format,
                        'Value': get_direction_from_u_v(
                            response.data[i].values.eastward_sea_water_velocity,
                            response.data[i].values.northward_sea_water_velocity
                        ),
                    });
                }
            }

            ////////////////////////////////////////////////
            ////////////////////////////////////////////////
            //// Embed the Vega visualizations into the DOM
            ////////////////////////////////////////////////
            ////////////////////////////////////////////////

            if (BASIC) {
                embed_vega_spec(
                    build_vega_spec(
                        'Air Temperature (' + tempscale + ')',
                        { 'values': air_temp_vals },
                        16, // warn threshold value
                        20 // alert threshold value
                    ),
                    '#air_temp'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Dew Point Temperature (' + tempscale + ')',
                        { 'values': dew_point_temp_vals },
                        7, // warn threshold value
                        9 // alert threshold value
                    ),
                    '#dew_point_temp'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Wind Speed (m/s)',
                        { 'values': wind_speed_vals },
                        8, // warn threshold value
                        11 // alert threshold value
                    ),
                    '#wind_speed'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Wind Gust (m/s)',
                        { 'values': wind_gust_vals },
                        8, // warn threshold value
                        11 // alert threshold value
                    ),
                    '#wind_gust'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Wind Direction (Degrees)',
                        { 'values': wind_dir_vals },
                        null, // no alert
                        null // no alert
                    ),
                    '#wind_direction'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Relative Humidity (%)',
                        { 'values': rel_hum_vals },
                        null, // no alert
                        null // no alert
                    ),
                    '#rel_hum'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Mean Sea Level Pressure (Pa)',
                        { 'values': air_press_sea_level_vals },
                        null, // no alert
                        null // no alert
                    ),
                    '#air_press_sea_level'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Precipitation (kg/m2)',
                        { 'values': precip_vals },
                        4, // warn threshold value
                        5 // alert threshold value
                    ),
                    '#precip'
                );
            }

            if (MARITIME) {
                embed_vega_spec(
                    build_vega_spec(
                        'Sea Surface Temperature (' + tempscale + ')',
                        { 'values': sea_surface_temp_vals },
                        null, // no alert
                        null // no alert
                    ),
                    '#sea_surface_temp'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Significant Wave Height (m)',
                        { 'values': wave_height_vals },
                        4, // warn threshold value
                        5 // alert threshold value
                    ),
                    '#wave_height'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Ocean Currents Speed (m/s)',
                        { 'values': ocean_currents_speed_vals },
                        0.15, // warn threshold value
                        0.2 // alert threshold value
                    ),
                    '#ocean_currents_speed'
                );
                embed_vega_spec(
                    build_vega_spec(
                        'Ocean Currents Direction (Degrees)',
                        { 'values': ocean_currents_dir_vals },
                        null, // no alert
                        null // no alert
                    ),
                    '#ocean_currents_direction'
                );
            }
            // reset cursor from spinning wheel to default
            document.getElementById('forecast_switch').style.cursor = 'pointer';
            document.body.style.cursor = 'default';
            // make the forecast popup visible
            document.getElementById("weatherStats").style.display = 'block';
            document.getElementById("grayPageOverlay").style.display = 'block';
            // reset forecast toggle button to not be active
            document.getElementById('selectForecastToggle').className = '';
            // disable forecast-on-map-click
            ENABLE_FORECAST = false;
        });
    // end promise
}