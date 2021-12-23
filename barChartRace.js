function drawBarRaceChart(text, option) {
  $("#label").html("");
  let dataFile = ""
  if (option === "all"){
    dataFile = "data/processed/covid_by_state.json"
  } else {
      dataFile = `data/processed/cov_by_county_${text}.json`
  }
  fetch(dataFile)
    .then((response) => response.json())
    .then((data) => createBarChartRace(data));
}




function createBarChartRace(data) {
  margin = { top: 16, right: 6, bottom: 6, left: 0 };
  barSize = 48;
  n = 10;
  height = margin.top + barSize * n + margin.bottom;
  width = height * 1.5;
  duration = 5;

  names = new Set(data.map((d) => d.name));
  console.log("***names***");
  console.log(names);
  datevalues = Array.from(
    d3v6.rollup(
      data,
      ([d]) => d.value,
      (d) => +new Date(d.date),
      (d) => d.name
    )
  )
    .map(([date, data]) => [new Date(date), data])
    .sort(([a], [b]) => d3v6.ascending(a, b));

  console.log("***datevalues***");
  console.log(datevalues);
  function rank(value) {
    const data = Array.from(names, (name) => ({
      name,
      value: value(name),
    }));
    data.sort((a, b) => d3v6.descending(a.value, b.value));
    for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
    return data;
  }

  k = 10;

  keyframes = (function () {
    const keyframes = [];
    let ka, a, kb, b;
    let latestKnownValue = new Map();
    for ([[ka, a], [kb, b]] of d3v6.pairs(datevalues)) {
      for (let i = 0; i < k; ++i) {
        const t = i / k;
        keyframes.push([
          new Date(ka * (1 - t) + kb * t),
          rank((name) => {
            result =
              (a.get(name) || latestKnownValue.get(name) || 0) * (1 - t) +
              (b.get(name) || latestKnownValue.get(name) || 0) * t;
            latestKnownValue.set(
              name,
              a.get(name) || latestKnownValue.get(name) || 0
            );
            return result;
          }),
        ]);
      }
    }
    keyframes.push([new Date(kb), rank((name) => b.get(name) || 0)]);
    return keyframes;
  })();

  nameframes = d3v6.groups(
    keyframes.flatMap(([, data]) => data),
    (d) => d.name
  );
  prev = new Map(
    nameframes.flatMap(([, data]) => d3v6.pairs(data, (a, b) => [b, a]))
  );
  next = new Map(nameframes.flatMap(([, data]) => d3v6.pairs(data)));

  function bars(svg) {
    let bar = svg.append("g").attr("fill-opacity", 0.6).selectAll("rect");

    return ([date, data], transition) =>
      (bar = bar
        .data(data.slice(0, n), (d) => d.name)
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("fill", color)
              .attr("height", y.bandwidth())
              .attr("x", x(0))
              .attr("y", (d) => y((prev.get(d) || d).rank))
              .attr("width", (d) => x((prev.get(d) || d).value) - x(0)),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr("y", (d) => y((next.get(d) || d).rank))
              .attr("width", (d) => x((next.get(d) || d).value) - x(0))
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("y", (d) => y(d.rank))
            .attr("width", (d) => x(d.value) - x(0))
        ));
  }

  function labels(svg) {
    let label = svg
      .append("g")
      .style("font", "bold 12px var(--sans-serif)")
      .style("font-variant-numeric", "tabular-nums")
      .attr("text-anchor", "end")
      .selectAll("text");

    return ([date, data], transition) =>
      (label = label
        .data(data.slice(0, n), (d) => d.name)
        .join(
          (enter) =>
            enter
              .append("text")
              .attr(
                "transform",
                (d) =>
                  `translate(${x((prev.get(d) || d).value)},${y(
                    (prev.get(d) || d).rank
                  )})`
              )
              .attr("y", y.bandwidth() / 2)
              .attr("x", -6)
              .attr("dy", "-0.25em")
              .text((d) => d.name)
              .call((text) =>
                text
                  .append("tspan")
                  .attr("fill-opacity", 0.7)
                  .attr("font-weight", "normal")
                  .attr("x", -6)
                  .attr("dy", "1.15em")
              ),
          (update) => update,
          (exit) =>
            exit
              .transition(transition)
              .remove()
              .attr(
                "transform",
                (d) =>
                  `translate(${x((next.get(d) || d).value)},${y(
                    (next.get(d) || d).rank
                  )})`
              )
              .call((g) =>
                g
                  .select("tspan")
                  .tween("text", (d) =>
                    textTween(d.value, (next.get(d) || d).value)
                  )
              )
        )
        .call((bar) =>
          bar
            .transition(transition)
            .attr("transform", (d) => `translate(${x(d.value)},${y(d.rank)})`)
            .call((g) =>
              g
                .select("tspan")
                .tween("text", (d) =>
                  textTween((prev.get(d) || d).value, d.value)
                )
            )
        ));
  }

  function textTween(a, b) {
    const i = d3v6.interpolateNumber(a, b);
    return function (t) {
      this.textContent = formatNumber(i(t));
    };
  }

  formatNumber = d3v6.format(",d");

  function axis(svg) {
    const g = svg.append("g").attr("transform", `translate(0,${margin.top})`);

    const axis = d3v6
      .axisTop(x)
      .ticks(width / 160)
      .tickSizeOuter(0)
      .tickSizeInner(-barSize * (n + y.padding()));

    return (_, transition) => {
      g.transition(transition).call(axis);
      g.select(".tick:first-of-type text").remove();
      g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
      g.select(".domain").remove();
    };
  }

  function ticker(svg) {
    const now = svg
      .append("text")
      .style("font-size", `${barSize}px`)
      .style("font-variant-numeric", "tabular-nums")
      .attr("text-anchor", "end")
      .attr("x", width - 6)
      .attr("y", margin.top + barSize * (n - 0.45))
      .attr("dy", "0.32em")
      .text(formatDate(keyframes[0][0]));

    return ([date], transition) => {
      transition.end().then(() => now.text(formatDate(date)));
    };
  }

  formatDate = d3v6.utcFormat("%B %d, %Y");

  color = (function () {
    const scale = d3v6.scaleOrdinal(d3v6.schemePaired);
    if (data.some((d) => d.category !== undefined)) {
      const categoryByName = new Map(data.map((d) => [d.name, d.category]));
      scale.domain(Array.from(categoryByName.values()));
      return (d) => scale(categoryByName.get(d.name));
    }
    return (d) => scale(d.name);
  })();

  x = d3v6.scaleLinear([0, 1], [margin.left, width - margin.right]);
  y = d3v6
    .scaleBand()
    .domain(d3v6.range(n + 1))
    .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
    .padding(0.1);

  const svg = d3v6
    .select("#chartDiv")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const updateBars = bars(svg);
  const updateAxis = axis(svg);
  const updateLabels = labels(svg);
  const updateTicker = ticker(svg);

  svg.node();

  async function update() {
    for (const keyframe of keyframes) {
      const transition = svg
        .transition()
        .duration(duration)
        .ease(d3v6.easeLinear);

      // Extract the top bar’s value.
      x.domain([0, keyframe[1][0].value]);

      updateAxis(keyframe, transition);
      updateBars(keyframe, transition);
      updateLabels(keyframe, transition);
      updateTicker(keyframe, transition);

      await transition.end();
    }
  }
  update();
}
