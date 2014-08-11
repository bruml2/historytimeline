historyTimeline = function() {
    var margin = {top: 20, right: 20, bottom: 20, left: 20};

    var width = 800,
        height = 600;

    function historyTimeline(selection) {
        selection.each(function(data) {
            var x = d3.scale.linear()
                .domain([d3.min(data.erasArr, function(d) { return d.start; }),
                         d3.max(data.erasArr, function(d) { return d.stop; })])
                .range([0, width - margin.left - margin.right])
                .nice();

            var y = d3.scale.linear()
                .range([0, height - margin.top - margin.bottom]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var svg = d3.select(this);

            var main = svg.append("g")
                .attr("class", "main")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            main.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")")
                    .call(xAxis);

            var eraG = main.selectAll("g.era").data(data.erasArr),
                eraGEnter = eraG.enter().append("g").attr("class", "era");
            eraGEnter.append("rect")
                .append("title")
                .text(function(d) { return d.description; });
            eraGEnter.append("text")
                .attr("dx", ".5ex")
                .attr("dy", "1em");

            eraG.attr("transform", function(d) {
                return "translate(" + x(d.start) + "," + y(d.topY) + ")";
            });
            eraG.select("rect")
                .style("fill", function(d) { return d.bgcolor; })
                .attr("width", function(d) { return x(d.stop) - x(d.start); })
                .attr("height", function(d) { return y(d.height); });
            eraG.select("text")
                .text(function(d) { return d.label; });

            eraG.exit().remove();

            var events = main.selectAll("circle.event").data(data.eventsArr);
            events.enter().append("circle")
                .append("title")
                .text(function(d) { return d.label; });
            events.attr("r", function(d) { return d.width; })
                .attr("cx", function(d) { return x(d.date); })
                .attr("cy", function(d) { return y(d.centerY); });

            events.exit().remove();
        });
    }

    historyTimeline.width = function(value) {
      if (!arguments.length) return width;
      width = value;
      return historyTimeline;
    };
  
    historyTimeline.height = function(value) {
      if (!arguments.length) return height;
      height = value;
      return historyTimeline;
    };

    historyTimeline.margin = function(value) {
      if (!arguments.length) return margin;
      margin = value;
      return historyTimeline;
    };

    return historyTimeline;
}
