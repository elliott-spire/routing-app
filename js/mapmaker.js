// https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/
var distinctColors = [
  '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabebe',
  '#469990', '#e6beff', '#9A6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9',
  '#ffffff', '#000000'
];

function hexToRGB(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getDistinctColor(num) {
  // get unique color
  var color = distinctColors[num];
  // if we run out of distinct colors,
  // start generating random ones
  if (color == undefined) {
    var r = String(Math.random()*256|0);
    var g = String(Math.random()*256|0);
    var b = String(Math.random()*256|0);
    color = 'rgb('+r+','+g+','+b+',0.7)';
  } else {
    var rgb = hexToRGB(color);
    // convert hex to RGBA to set opacity to 70%
    color = 'rgb('+rgb.r+','+rgb.g+','+rgb.b+',0.7)';
  }
  return color;
}

function styleFunction(feature) {
  var baseStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: feature.getProperties().color,
      lineDash: [10],
      width: 3
    })
  });
  return baseStyle;
  // return styles[feature.getGeometry().getType()];
};

function buildFeature(geojson) {
  var geometry = geojson["features"][0]["geometry"];
  var properties = geojson["features"][0]["properties"];
  var coords = geometry["coordinates"];
  // default OSM projection is EPSG:3857 but `coords` arg is in standard EPSG:4326 format
  // https://gis.stackexchange.com/questions/48949/epsg-3857-or-4326-for-googlemaps-openstreetmap-and-leaflet
  // https://gis.stackexchange.com/questions/152245/geojson-and-osm-layers-with-different-projection
  var convertedCoords = [];
  for (var i=0; i<coords.length; i++) {
    var coord = coords[i];
    // var lon = coord[0];
    // var lat = coord[1];
    // // Transforms a coordinate from longitude/latitude to a different projection.
    // // https://openlayers.org/en/latest/apidoc/module-ol_proj.html#.fromLonLat
    var newCoord = ol.proj.fromLonLat(coord, "EPSG:3857");
    convertedCoords.push(newCoord);
  }

  var feature = {
    'type': 'Feature',
    'properties': {
      'color': properties['color']
    },
    'geometry': {
      'type': 'LineString',
      'coordinates': convertedCoords
    }
  }
  return feature;
}

function createMap(geojsons) {
  // clear the existing map element
  document.getElementById('map').innerHTML = '';
  // build features
  var features = [];
  for (var i=0; i<geojsons.length; i++) {
    var feature = buildFeature(geojsons[i], i);
    features.push(feature);
  }

  var geojsonObject = {
    'type': 'FeatureCollection',
    'features': features
  };

  var vectorSource = new ol.source.Vector({
    features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
  });

  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: styleFunction,
    // format: new GeoJSON({
    //   internalProjection: new Projection("EPSG:4326"),
    //   externalProjection: new Projection("EPSG:3857")
    // })
  });

  var view = new ol.View({
    // projection: 'EPSG:4326',
    // center: [0, 40],
    // // set to first GeoJSON coordinate
    // // to be roughly in the right area
    // center: ol.proj.fromLonLat(coords[0], "EPSG:3857"),
    center: [0, 0],
    zoom: 2
  });

  var mousePositionControl = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    // comment the following two lines to have the mouse position
    // be placed within the map.
    className: 'custom-mouse-position',
    target: document.getElementById('mousePosition'),
    undefinedHTML: '&nbsp;'
  });

  var mapHeight = '900px';
  document.getElementById('map').style.height = mapHeight;
  document.getElementById('mapContainer').style.minHeight = mapHeight;
  var map = new ol.Map({
    controls: ol.control.defaults().extend([mousePositionControl]),
    layers: [
      new ol.layer.Tile({
        // free OpenStreetMap tileset
        source: new ol.source.OSM()
      }),
      vectorLayer
    ],
    target: 'map',
    view: view
  });

  // var projectionSelect = document.getElementById('projection');
  // projectionSelect.addEventListener('change', function(event) {
  //   mousePositionControl.setProjection(event.target.value);
  // });

  // var precisionInput = document.getElementById('precision');
  // precisionInput.addEventListener('change', function(event) {
  // var format = createStringXY(event.target.valueAsNumber);
  //   mousePositionControl.setCoordinateFormat(format);
  // });

  // view.centerOn(fromLonLat(coords[0], "EPSG:3857"), map.getSize(), [570, 500]);

  // // shift the text content down to avoid the map
  // document.getElementById('textContainer').style.marginTop = '50px';

  // set up the "Download Map Image" button
  var downloadLink = document.getElementById('downloadMap');
  downloadLink.style.visibility = 'visible';
  downloadLink.style.marginBottom = '10px';
  downloadLink.onclick = function() {
    // get <canvas> elements created by OpenLayers
    var canvases = document.getElementsByTagName('canvas');
    var layer1 = canvases[0];
    var layer2 = canvases[1];
    // generate one image from combined map and GeoJSON layers
    var imgURI = overlayCanvases(layer1, layer2);
    // create an invisible "link" to initiate the download
    var link = document.createElement("a");
    // specify a name for the image file to be downloaded as
    link.download = 'routes.png';
    link.href = imgURI;
    // add the invisible "link" to the DOM so it can be "clicked"
    document.body.appendChild(link);
    // "click" the invisible link
    link.click();
    // remove the invisible "link" from the DOM
    document.body.removeChild(link);
    // K.O.
    delete link;
  };
  var selectForecast = document.getElementById('selectForecastToggle');
  selectForecast.style.visibility = 'visible';
  selectForecast.style.marginBottom = '10px';
}

// combine two <canvas> HTML elements into one image for download:
// one layer is the map
// one layer is the visualized GeoJSON
var overlayCanvases = function(cnv1, cnv2) {
  // https://stackoverflow.com/questions/38851963/how-to-combine-3-canvas-html-elements-into-1-image-file-using-javascript-jquery
  var newCanvas = document.createElement('canvas');
  var ctx = newCanvas.getContext('2d');
  // assumes each canvas has the same dimensions
  var width = cnv1.width;
  var height = cnv1.height;
  newCanvas.width = width;
  newCanvas.height = height;

  [cnv1, cnv2].forEach(function(n) {
      ctx.beginPath();
      if (n != undefined) {
        ctx.drawImage(n, 0, 0, width, height);
      }
  });

  return newCanvas.toDataURL("image/png");
};
