// change the time format to what the Vega graphs library expects
function get_vega_time(d) {
    var datestring = d.split("T");
    var time = datestring[1].split(",")[0].split("+")[0];
    return datestring[0] + ' ' + time;
}

// temperature scale conversions
function get_temperature(data, tempscale) {
    var temp;
    var temp_kelvin = data;
    if (tempscale == 'F') {
        temp = (temp_kelvin - 273.15) * 9/5 + 32; // Kelvin to Fahrenheit
    } else if (tempscale == 'K') {
        temp = temp_kelvin; // API response is already in Kelvin
    } else {
        temp = temp_kelvin - 273.15; // Kelvin to Celsius
    }
    return temp;
}

// get wind (or ocean currents) speed from U and V velocity components
function get_speed_from_u_v(u, v) {
    return Math.sqrt(Math.pow(u, 2) + Math.pow(v, 2))
}

// get wind (or ocean currents) direction from U and V velocity components
function get_direction_from_u_v(u, v) {
    // Meteorological wind direction
    //   90° corresponds to wind from east,
    //   180° from south
    //   270° from west
    //   360° wind from north.
    //   0° is used for no wind.
    if ((u, v) == (0.0, 0.0)) {
        return 0.0
    } else {
        return (180.0 / Math.PI) * Math.atan2(u, v) + 180.0;
    }
}

// subtract previous precipitation value from current data
// since raw value is Accumulated over all time
// and we want each bar to be the value for that time window only
function parse_precipitation(data, i) {
    var precip;
    if (i != 0) {
        var previous = data[i - 1].values.precipitation_amount;
        precip = data[i].values.precipitation_amount - previous;
    } else {
        precip = data[i].values.precipitation_amount;
    }
    return precip;
}