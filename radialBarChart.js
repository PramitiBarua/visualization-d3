function drawRadialBarChartHelper(text, option) {
  console.log(`text is ${text} option is ${option}`);
  let dataFile = "";
  if (option === "all") {
    dataFile = "data/processed/radial/cov_usa_totals.csv";
  } else {
    dataFile = `data/processed/radial/cov_${option}_totals.csv`;
  }
  drawRadialBarChart(dataFile);
  // fetch(dataFile)
  //   .then((response) => response.json())
  //   .then((data) => createBarChartRace(data));
}

function drawRadialBarChart(dataFile) {
  var svg = d3v4
    .select("#chartDiv")
    .append("svg")
    .attr("width", 900)
    .attr("height", 900)
    .attr("class", "charts");
  // .attr("font-size", "10px")
  // font-family="sans-serif"
  //         font-size="8"
  //         class="charts"
  width = 850; //+svg.attr("width"),
  height = 850; //+svg.attr("height"),
  (innerRadius = 180),
    (outerRadius = Math.min(width, height) / 2),
    (g = svg
      // .append("center")
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"));

  var x = d3v4
    .scaleBand()
    .range([0, 2 * Math.PI])
    .align(0);

  var y = d3v4.scaleRadial().range([innerRadius, outerRadius]);

  var z = d3v4
    .scaleOrdinal()
    .range([
      "#98abc5",
      "#8a89a6",
      "#7b6888",
      "#6b486b",
      "#a05d56",
      "#d0743c",
      "#ff8c00",
    ]);

  d3v4.csv(
    dataFile,
    function (d, i, columns) {
      for (i = 1, t = 0; i < columns.length; ++i)
        t += d[columns[i]] = +d[columns[i]];
      d.total = t;
      return d;
    },
    function (error, data) {
      if (error) throw error;

      x.domain(
        data.map(function (d) {
          return d.State;
        })
      );
      y.domain([
        0,
        d3v4.max(data, function (d) {
          return d.total;
        }),
      ]);
      z.domain(data.columns.slice(1));

      g.append("g")
        .selectAll("g")
        .data(d3v4.stack().keys(data.columns.slice(1))(data))
        .enter()
        .append("g")
        .attr("fill", function (d) {
          return z(d.key);
        })
        .selectAll("path")
        .data(function (d) {
          return d;
        })
        .enter()
        .append("path")
        .attr(
          "d",
          d3v4
            .arc()
            .innerRadius(function (d) {
              return y(d[0]);
            })
            .outerRadius(function (d) {
              return y(d[1]);
            })
            .startAngle(function (d) {
              return x(d.data.State);
            })
            .endAngle(function (d) {
              return x(d.data.State) + x.bandwidth();
            })
            .padAngle(0.01)
            .padRadius(innerRadius)
        );

      /////////
      var div = d3v4.select("#label").append("div").attr("class", "bg-primary");

      // svg.call(tip);
      //////////

      var label = g
        .append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
          return (
            "rotate(" +
            (((x(d.State) + x.bandwidth() / 2) * 180) / Math.PI - 90) +
            ")translate(" +
            innerRadius +
            ",0)"
          );
        });

      label.append("line").attr("x2", -5).attr("stroke", "#000");

      label
        .append("text")
        .attr("transform", function (d) {
          return (x(d.State) + x.bandwidth() / 2 + Math.PI / 2) %
            (2 * Math.PI) <
            Math.PI
            ? "rotate(90)translate(0,16)"
            : "rotate(-90)translate(0,-9)";
        })
        .attr("font-size", "10px")
        .text(function (d) {
          return d.State.slice(0, 2);
        })
        .on("mouseover", function (d) {
          console.log(d);
          let html = `
      <div class="bg-warning p-2">
      <div>County name: ${d.State}</div>
      <div>Cases: ${d.cases}</div>
      <div>Deaths: ${d.deaths}</div>
      </div>
      `;
          div.style("opacity", 1).html(html);
          return html;
        })
        .on("mouseout", function (d) {
          div.style("opacity", 0);
          // div.style("opacity", 0);
          // setTimeout(function () {
          //   div.html("");
          // },10000);
        });

      // var tooltip = d3
      //   .select("body")
      //   .append("div")
      //   .style("position", "absolute")
      //   .style("z-index", "10")
      //   .style("visibility", "hidden")
      //   .style("background", "#000")
      //   .text("a simple tooltip");

      var yAxis = g.append("g").attr("text-anchor", "middle");

      var yTick = yAxis
        .selectAll("g")
        .data(y.ticks(5).slice(1))
        .enter()
        .append("g");

      yTick
        .append("circle")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("r", y);

      yTick
        .append("text")
        .attr("y", function (d) {
          return -y(d);
        })
        .attr("dy", "0.35em")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 5)
        .text(y.tickFormat(5, "s"));

      yTick
        .append("text")
        .attr("y", function (d) {
          return -y(d);
        })
        .attr("dy", "0.35em")
        .text(y.tickFormat(5, "s"));

      yAxis
        .append("text")
        .attr("y", function (d) {
          return -y(y.ticks(5).pop());
        })
        .attr("dy", "-1em")
        .text("Count");

      var legend = g
        .append("g")
        .selectAll("g")
        .data(data.columns.slice(1).reverse())
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
          return (
            "translate(-40," + (i - (data.columns.length - 1) / 2) * 20 + ")"
          );
        });

      legend
        .append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", z);

      legend
        .append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(function (d) {
          return d;
        });
    }
  );
}
