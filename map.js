//insert meapbox/leaflet APIKEY
API_KEY = 'pk.eyJ1IjoiY2FuZGVsYWJyYSIsImEiOiJja2Fvb2tydHMwMHR4MnNwNjhleGhnbTJvIn0.ZihsAO4gC1usDHxas28b2w'

//geoJSON URL for 2.5+ earthquakes in the past 7 days
const earthquakesURL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson';

//url for the tectonic plates geojson
const tectonicURL = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json' 

//get request to the earthquake geojson url
d3.json(earthquakesURL, data => {
  createFeatures(data.features);
});

//function to return the appropriate color for the markers
function circleColor(mag) {
    return mag > 6.0 ? '#800026' :
           mag > 5.5 ? '#BD0026' :
           mag > 5.0 ? '#E31A1C' :
           mag > 4.5 ? '#FC4E2A' :
           mag > 4.0 ? '#FD8D3C' :
           mag > 3.5 ? '#FEB24C' :
           mag > 3.0 ? '#FED976' :
                       '#FFEDA0';
}

function circleRadius(mag) {
  return Math.sqrt(mag) * 7;
}

function createFeatures(earthquakeData) {
  
  //make the earthquake markers w/ tooltips
  let earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: (feature, layer) => {
      return layer.bindPopup(`<h3> ${feature.properties.place} </h3><hr><p> ${new Date(feature.properties.time)} </p><hr><p> Magnitude: ${feature.properties.mag} </p>`);
    },
    //make them circles w/ a gradient color and size
    pointToLayer: (feature, latlng) => {
      let markerOptions = {
        radius: circleRadius(feature.properties.mag),
        fillColor: circleColor(feature.properties.mag),
        color: "#000",
        weight: .5,
        opacity: 1,
        fillOpacity: .7
      };      
      return L.circleMarker(latlng, markerOptions);
    }
  });
  createMap(earthquakes);
} 

function createMap(earthquakes) {

  //make an object so the map doesn't repeat
  let noRepeat = {    
    noWrap: true,
    bounds: [
      [-90, -180],
      [90, 180]
    ]
  };
  
  //make the layers for satellite, streets, and greyscale
  let satellite = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox/satellite-v9",
    accessToken: API_KEY
  });
  
  let streets = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox/streets-v11",
    accessToken: API_KEY
  });

  let grey = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox/light-v10",
    accessToken: API_KEY
  });

  //define baseMaps object to hold the base layers
  let baseMaps = {
    Satellite: satellite,
    Streets: streets,
    Greyscale: grey
  };

  //create tectonic plates layer
  let plates = new L.LayerGroup();

  //make it so just the lines show and set line style
  let plateStyle = {
    fillOpacity: 0,
    opacity: .4,
    color: '#00FFFF'
  };

  //get the tectonic plates data
  d3.json(tectonicURL, data => {
    L.geoJSON(data, {style: plateStyle, pane: 'lines'}).addTo(plates);
  });

  //create overlay object to hold the overlay layers
  let overlayMaps = {
    'Tectonic Plates': plates,
    Earthquakes: earthquakes        
  };

  //create the map w/ satellite and earthquakes on load
  let myMap = L.map('map', {
    center: [
      32.69530673, 
      -40.43175435
    ],
    zoom: 3,
    layers: [streets, plates, earthquakes]
  });

  //make the tectonic lines go behind the earthquakes layer
  myMap.createPane('lines');
  myMap.getPane('lines').style.zIndex = 300;

  //make the legend 
  let legend = L.control({position: 'bottomright'});

  legend.onAdd = map => {
    let div = L.DomUtil.create('div', 'info legend'),
      mags = [2.5, 3, 3.5, 4, 4.5, 5, 5.5],
      labels = [];

    //loop through the magnitudes and generate a label with a colored square for each interval
    for (let i = 0; i < mags.length; i++) {
      div.innerHTML +=
        '<i style="background:' + circleColor(mags[i] + 1) + '"></i> ' +
        mags[i] + (mags[i + 1] ? '&ndash;' + mags[i + 1] + '<br>' : '+');
    }
    return div;
  };
  legend.addTo(myMap);

  //layer control
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  })
  .addTo(myMap);
}

