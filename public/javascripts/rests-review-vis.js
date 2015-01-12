var width = 800;
var height = 600;
var rest_circle_color = d3.scale.category20();
var rest_circle_r_scale = d3.scale.linear()
  .domain([0, 150])
  .range([3, 150]);

queue()
  .defer(d3.json, "/api/restaurants?longitude=139.757827&latitude=35.712850")
  .await(initialize);

function initialize(error, rests) {
  // google.maps.event.addDomListener(window, 'load', initialize);
  // console.log(rests);
  var mapCanvas = document.getElementById('map-canvas');
  var mapOptions = {
    center: new google.maps.LatLng(35.712850, 139.757827),
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };
  var map = new google.maps.Map(mapCanvas, mapOptions);
  var overlay = new google.maps.OverlayView();
  overlay.onAdd = function() {
    var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "layer");
    var svg = layer.append("svg").append("g");
    var overlayProjection = this.getProjection();
    var googleMapProjection = function(coordinates){
      var googleCoordinates = new google.maps.LatLng(coordinates[0], coordinates[1]);
      var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
      return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
    };

    path = d3.geo.path().projection(googleMapProjection);
    // console.log(rests);
    svg.selectAll("circle")
      .data(rests)
      .enter().append("circle");

    overlay.draw = function () {
      //地図描く
      svg.selectAll("circle")
        .attr("opacity", 0.5)
        .attr("fill", function(d){return rest_circle_color(d.categories.category_name_l[0]);})
        .attr("r", function(d) {
          // console.log(d.total_score);
          // console.log(d.categories);
          if(d.score_count){return rest_circle_r_scale(d.score_count);}
          else{return 3;}
        })
        .attr("cx", function(d) {return googleMapProjection([d.location.latitude_wgs84, d.location.longitude_wgs84])[0];})
        .attr("cy", function(d) {return googleMapProjection([d.location.latitude_wgs84, d.location.longitude_wgs84])[1];})
        .on("mouseover", function (d) {
          // test(d);
        });
        var center = map.getCenter();
        var location = {
          latitude: center.lat(),
          longitude: center.lng(),
        };
    };
  };
  overlay.setMap(map);
}

function update(){
}

function test (d) {
	console.log(d.name.name);
	console.log(d.contacts.address);
	console.log(d.contacts.tel);
}

