function drawCovidMapHelper(text, option){
    console.log(`text is ${text} option is ${option}`);
    $("#label").html("");
    drawMap("data/processed/map/cov_usa_totals.csv");

}

function drawMap(dataFile) {

var width = 900;
height = 700;

var tip = d3v3
  .tip()
  .attr("class", "d3v3-tip")
  .offset([-5, 0])
  .html(function (d) {
    var dataRow = countryById.get(d.properties.name);
    if (dataRow) {
      console.log(dataRow);
      let html = `
      <div class="bg-light p-2">
      <div>State: ${dataRow.states}</div>
      <div>Cases: ${dataRow.cases}</div>
      <div>Deaths: ${dataRow.deaths}</div>
      </div>
      `;
      return html//dataRow.states + ": " + dataRow.cases;
    } else {
      console.log("no dataRow", d);
      return d.properties.name + ": No data.";
    }
  });

var svg = d3v3
  .select("#chartDiv")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

svg.call(tip);

var projection = d3v3.geo
  .albersUsa()
  .scale(900) // mess with this if you want
  .translate([width / 2, height / 2]);

var path = d3v3.geo.path().projection(projection);

var colorScale = d3v3.scale
  .linear()
  .range(["#D4EEFF", "#0099FF"])
  .interpolate(d3v3.interpolateLab);

var countryById = d3v3.map();

// we use queue because we have 2 data files to load.
queue()
  .defer(d3v3.json, "data/USA.json")
  .defer(d3v3.csv, dataFile, typeAndSet) // process
  .await(loaded);

function typeAndSet(d) {
  d.cases = +d.cases;
  countryById.set(d.states, d);
  return d;
}

function getColor(d) {
  var dataRow = countryById.get(d.properties.name);
  if (dataRow) {
    console.log(dataRow);
    return colorScale(dataRow.cases);
  } else {
    console.log("no dataRow", d);
    return "#ccc";
  }
}

function loaded(error, usa, mortality) {
  console.log(usa);
  console.log(mortality);

  colorScale.domain(
    d3v3.extent(mortality, function (d) {
      return d.cases;
    })
  );

  var states = topojson.feature(usa, usa.objects.units).features;

  svg
    .selectAll("path.states")
    .data(states)
    .enter()
    .append("path")
    .attr("class", "states")
    .attr("d", path)
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide)
    .attr("fill", function (d, i) {
      console.log(d.properties.name);
      return getColor(d);
    })
    .append("title");

  var linear = colorScale;

  svg
    .append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(20,20)");

  var legendLinear = d3v3.legend
    .color()
    .shapeWidth(30)
    .orient("horizontal")
    .scale(linear);

//   svg.select(".legendLinear").call(legendLinear);
}
}
