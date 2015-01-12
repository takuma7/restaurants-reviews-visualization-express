var width = 800;
var height = 600;

var goods = [
  "美味しい","おいしい","満足","まんぞく","おすすめ","オススメ",
  "いっぱい","美味","優しい","やさしい","良い","いい","よい","暖かい","あたたかい",
  "絶品","やわらか","ふわふわ","フワフワ","たっぷり","安","うまい","うまさ","滑らか","なめらか","気さく",
  "新鮮","ハイレベル","刺激","さすが","嬉しい","うれしい","バランス","素晴","優れ","素敵","感謝","柔","すごか",
  "食欲","あっさり","ビックリ","びっくり","最高","濃","衝撃","甘","きれい","なつかしい","激辛"
];
var bads = [
  "まずい","悪い","わるい","高"
];

var rests_data;
var feature_of_rests;

var color = d3.scale.category20();
var scale = d3.scale.linear()
  .domain([1, 100])
  .range([4, 80]);

var levels = [1, 1.7, 2.7, 3.7, 4.7];
// var quantizeRed = [
  // "rgb(254,229,217)",
  // "rgb(252,174,145)",
  // "rgb(251,106,74)",
  // "rgb(222,45,38)",
  // "rgb(165,15,21)"
// ];
// var quantizeRed = [
  // "hsl(0, 100%, 10%)",
  // "hsl(0, 100%, 20%)",
  // "hsl(0, 100%, 30%)",
  // "hsl(0, 100%, 70%)",
  // "hsl(0, 100%, 100%)",
// ];
var quantizeRed = [
  "#00bfff",
  "#008000",
  "#ffd700",
  "#ff8c00",
  "#ff4500",
];
/*
1　　 　⇒　水色
1.5～2　⇒　緑色
2.5～3　⇒　黄色
3.5～4　⇒　橙色
4.5～5　⇒　赤色
*/

var colorRed = d3.scale.linear()
  .domain(levels)
  .range(quantizeRed)
  .interpolate(d3.interpolateHcl);

var tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

console.log("start!!");
var url = "/api/restaurants?";
var latitude = "35.7055238";
var longitude = "139.75966110000002";

queue()
  .defer(d3.json, "/api/restaurants?longitude=139.7596611000002&latitude=35.7055238")
  .await(initialize);

var svg;
var map;
var geocoder;

function initialize(error, rests) {
  process(rests, "35.7055238", "139.75966110000002");
}

function process(rests, latitude, longitude) {
  // console.log(rests);
  rests_data = rests;
  extract_feature();
  var mapCanvas = document.getElementById('map-canvas');
  var mapOptions = {
    center: new google.maps.LatLng(latitude, longitude),
    zoom: 16,
    minZoom: 16,
    maxZoom: 20,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]}]
  };
  geocoder = new google.maps.Geocoder();
  map = new google.maps.Map(mapCanvas, mapOptions);
  var overlay = new google.maps.OverlayView();
  overlay.onAdd = function() {
    var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "layer");
    svg = layer.append("svg").append("g");
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
        .attr("r", function(d) {
          if (d.votes === null || d.votes.length === 0) return 2;
          return scale(d.votes.length);
        })
        .attr("opacity", 0.5)
        .attr("fill", function (d) {
          if (d.votes === null || d.votes.length === 0) return "#000";
          return colorRed(d.avg_score);
        })
        .attr("stroke", function(d){
          // return d3.hsl(color(d.categories.category_name_l[0])).darker(5-d.avg_score);
          return color(d.categories.category_name_l[0]);
        })
        .attr("stroke-width", 1.3)
        .attr("cx", function(d) {return googleMapProjection([d.location.latitude_wgs84, d.location.longitude_wgs84])[0];})
        .attr("cy", function(d) {return googleMapProjection([d.location.latitude_wgs84, d.location.longitude_wgs84])[1];})
        .on("mouseover", function (d, i) {
          tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);

          tooltip.html("<b>" + d.name.name + "<b><br/>" + d.contacts.address + "<br/>" + d.contacts.tel + "<br/>" + d.avg_score)
          .style("left", (d3.event.pageX + 20) + "px")
          .style("top", (d3.event.pageY + 20) + "px");
        })
        .on("click", function (d, i) {
          display(i);
        })
        .on("mouseout", function (d) {
          tooltip.transition()
          .duration(500)
          .style("opacity", 0);
        });
    };
  };
  overlay.setMap(map);
}

function getLocation() {
  var address = document.getElementById("address").value;
  geocoder.geocode({'address': address}, function (results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      console.log(results[0].geometry.location);
    }
    else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
}

function convert (word) {
  if (word == "おいしい" || word == "美味") return "美味しい";
  if (word == "よい" || word == "いい") return "良い";
  if (word == "安") return "安い";
  if (word == "高") return "高い";
  if (word == "うまさ") return "うまい";
  if (word == "なめらか") return "滑らか";
  if (word == "優れ") return "優れる";
  if (word == "素晴") return "素晴らしい";
  if (word == "柔" || word == "やわらか") return "柔らかい";
  if (word == "すごか") return "すごい";
  if (word == "フワフワ") return "ふわふわ";
  if (word == "ビックリ") return "びっくり";
  if (word == "濃") return "濃い";
  if (word == "うれしい") return "嬉しい";
  return word;
}

function extract_feature () {
  feature_of_rests = new Array(rests_data.length);
  for (var i = 0; i < rests_data.length; i++) {
    extract(rests_data[i], i);
  }
}

function extract (d, ind) {
  var word = [];
  if (d.votes !== null && d.votes.length !== 0) {
    var segmenter = new TinySegmenter();
    var hash_goods = {};
    var hash_bads = {};
    for (var i = 0; i < d.votes.length; i++) {
      var segs = segmenter.segment(d.votes[i].comment);
      for (var j = 0; j < segs.length; j++) {
        for (var k = 0; k < goods.length; k++) {
          if (segs[j].indexOf(goods[k]) != -1) {
            if (goods[k] in hash_goods) hash_goods[convert(goods[k])]++;
            else hash_goods[convert(goods[k])] = 1;
          }
        }
        for (var k = 0; k < bads.length; k++) {
          if (segs[j].indexOf(bads[k]) != -1) {
            if (bads[k] in hash_bads) hash_bads[convert(bads[k])]++;
            else hash_bads[convert(bads[k])] = 1;
          }
        }
      }
    }
    for (var x in hash_goods) {
      word.push({"text": x, "size": 20 + 10 * hash_goods[x]});
    }
    for (var x in hash_bads) {
      word.push({"text": x, "size": 20 + 10 * hash_bads[x]});
    }
  }

  for (var i = 0; i < d.categories.category_name_s.length; i++) {
    if (typeof d.categories.category_name_s[i] == 'string') {
      var list_word = d.categories.category_name_s[i].split(/[ \(,・\)]+/);
      for (var j = 0; j < list_word.length; j++) {
        if (list_word[j] == "その他") continue;
        word.push({"text": list_word[j], "size": 20});
      }
    }
  }
  feature_of_rests[ind] = word;
}

function display(i) {
  d3.layout.cloud().size([545, 200])
  .words(feature_of_rests[i])
  .rotate(0)
  .fontSize(function(d) { return d.size; })
  .on("end", feature)
  .start();

  function feature(words) {
    d3.select(".wordcloud").remove();
    d3.select("body").append("svg")
    .attr("width", 545)
    .attr("height", 200)
    .attr("class", "wordcloud")
    .append("g")
    .attr("transform", "translate(200,100)")
    .selectAll("text")
    .data(words)
    .enter().append("text")
    .style("font-size", function(d) { return d.size + "px"; })
    .style("fill", function(d, i) { return color(i); })
    .attr("transform", function(d) {
      return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
    })
    .text(function(d) { return d.text; })
    .on("click", function (word) {
      filter_word(word.text);
    })
    .on("dblclick", function (d) {
      reset();
    });
  }
}

function is_contain (ind, word) {
  for (var i = 0; i < feature_of_rests[ind].length; i++) {
    if (feature_of_rests[ind][i].text == word) return true;
  }
  return false;
}

function filter_word (word) {
  svg.selectAll("circle")
  .style("visibility", function (d, i) {
    if (is_contain(i, word)) return "visible";
    return "hidden";
  });
}

function reset () {
  svg.selectAll("circle")
  .style("visibility", "visible");
}
