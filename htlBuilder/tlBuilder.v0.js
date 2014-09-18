/* this is a file fragment saved for archive purposes */

/* ======================================================================== */
d3.tl.currEra = new d3.tl.Era();
d3.tl.buildEraUI = function () {
  //add HTML for UI;
  d3.select("#eraUI")
    .style({"margin-bottom": "20px",
            "width": "500px"
    })
    .html("<div id=\"eraHeader\" style=\"padding: 10px; border: 2px solid blue; margin-bottom: 4px;\">Label: <input id=\"eraLabel\" size=\"60\" placeholder=\"Era label goes here!\" /><br />Start year: <input id=\"eraStart\" size=\"5\" placeholder=\"Start\" />&nbsp;&nbsp;&nbsp;&nbsp;Stop year: <input id=\"eraStop\" size=\"5\" placeholder=\"Stop\" /></div><div id=\"eraOptions\" style=\"padding: 10px; border: 2px solid red\"><h3><em>Optional:</em></h3>Color: <input id=\"eraColor\" size=\"7\" placeholder=\"#F5A9E1\" />&nbsp;&nbsp;&nbsp;&nbsp;Top (<span id=\"explTop\">explain</span>):  <input id=\"eraTop\" size=\"4\" placeholder=\"0.2\" />&nbsp;&nbsp;&nbsp;&nbsp;Height (<span id=\"explHeight\">explain</span>): <input id=\"eraHeight\" size=\"4\" placeholder=\"0.8\" /></div>"
  );
};
d3.tl.updateEraUI = function (currEra) {
  d3.select("#eraLabel")
    .attr("value", currEra.label)
    .on("keyup", function () {
      d3.tl.currEra.label = this.value;
      console.log("label: " + d3.tl.currEra.label);
      d3.tl.drawEraSVG(d3.tl.currEra);
    });
  d3.select("#eraStart").attr("value", currEra.start);
  d3.select("#eraStop").attr("value", currEra.stop);
  d3.select("#eraColor").attr("value", currEra.bgcolor);
  d3.select("#eraTop").attr("value", currEra.topY);
  d3.select("#eraHeight").attr("value", currEra.height);
};
d3.tl.drawEraSVG = function (currEra) {
  d3.select("#svg").remove();
  d3.select("#eraLabelsGrp").remove();
  var svgWidth = 500;
  var svgSideMargin = 25;
  var eraTopMargin = 30;
  var eraHeight = 300;
  var timeAxisHeight = 50;
  var svgHeight = eraTopMargin + eraHeight + timeAxisHeight;  // 380

  var svg = d3.select("#eraSVG")
      // must be set programmatically!
      .style({"width": "500px",
              "height": (svgHeight + 4) + "px",
              "position": "relative"
             })
    .append("svg")
      .attr("id", "svg")
      .style("width", svgWidth)
      .style("height", svgHeight)
      .style("border", "2px solid #0404B4")
      .style("background-color", "bisque");

  // ===== timescale for x-axis;
  d3.select("body").append("style")
    .attr("id", "timeAxisStyles")
    .text("#timeAxisGrp path, #timeAxisGrp line {" +
          "  fill: none;" +
          "  stroke: black;" +
          "  shape-rendering: crispEdges; /* SVG attribute */}" +
          "#timeAxisGrp text {" +
          "  font-family: sans-serif;" +
          "  font-size: 13px;" +
          "  text-rendering: optimizeLegibility; /* SVG attribute */}");

  //  adjust this depending on width of era;
  var minDate = currEra.start - 100;
  var maxDate = currEra.stop  + 100;
  var timeScale = d3.scale.linear()
                          .domain([minDate, maxDate])
                          .rangeRound([svgSideMargin,
                                  svgWidth - svgSideMargin])
                          .nice();
  // timeAxis is a function which returns the SVG elements for the axis;
  var timeAxis = d3.svg.axis()
                       .scale(timeScale);
  svg.append("g")
      .attr("id", "timeAxisGrp")
      // default position is at top of SVG; move to bottom;
      .attr("transform",
            "translate(0, " + (eraTopMargin + eraHeight + 15) + ")")
      // see relevant CSS styling for path, line, and text;
      .call(timeAxis);

  // ===== the current Era;
  var erasGrp = svg.append("g")
      .attr("id", "erasGrp")
      .selectAll("rect")
      .data([currEra])
      .enter()
      // one rect for each object in the array;
    .append("rect")
      // the id is the label, e.g., "UnitedKingdom" (alphanum only);
      .attr("id", function(d){ return d.label.replace(/\W/g, "") })
      .attr("x", function(d){ return timeScale(d.start) })
      .attr("y", function(d){ return eraTopMargin + (d.topY * eraHeight) })
      // slightly rounded corners;
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", function(d){ return timeScale(d.stop) -
                                         timeScale(d.start) })
      .attr("height", function(d){ return d.height * eraHeight })
      .style("fill", function(d){ return d.bgcolor })
      .style("stroke-width", 1)
      .style("stroke", "black");

  // ===== the Era label
  // draw label as **HTML div** to take advantage of text wrapping;
  // if widest word is wider than the era itself, then it overflows;
  // in such a case, we want to make the <div> wide enough and place
  // it evenly straddling the era.
  var fontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  var eraLabelsFontSize = "16px";
  // create temporary invisible span to test width of widest word;
  var widthSpan = d3.select("body")
      .append("span")
      .attr("id", "overflowSpan")
      .style("position", "absolute")
      .style("visibility", "hidden");
  var getLeftAndStoreWidthVoffset = function(d) {
    /* this function: returns the x-coordinate of the HTML <div> which will
       contain the label (if label is wider than era then must shift div left);
       finds the longest word; gets its width; tests whether wider than the era;
       if not, returns the x-coorinate of the era-start; if so, returns the
       x-coordinate for the wider <div>; stores two values in d (the eraObj):
       the width of the <div> and 0 for voffset if property is missing;
    */
    // add a missing voffset property (pushes label down);
    d.voffset = d.voffset ? d.voffset : 0;
    // does widest word overflow? Sort by length descending;
    var words = d.label.split(/ /);
    var longestWord = 
            words.sort(function(a,b){ return b.length - a.length })[0];
    // console.log("Longest: " + longestWord);
    // put it in the invisible span and get width;
    widthSpan.text(longestWord);
    var longestWordWidth =
                      document.getElementById("overflowSpan").clientWidth;
    // console.log("Width of " + longestWord + ": " + longestWordWidth);
    var widthOfEra = timeScale(d.stop) - timeScale(d.start);
    // console.log("Width of " + d.label + ": " + widthOfEra);
    if (widthOfEra > longestWordWidth) {
      d.width = widthOfEra;
      return timeScale(d.start) + "px";
    } else {
      d.width = longestWordWidth + 2;
      var offsetLeft = timeScale(d.start) - ((d.width - widthOfEra) / 2);
      // console.log("Offset left: " + offsetLeft);
      return offsetLeft + "px";
    }
  }; // end of getLeftAndStoreWidthVoffset();
  d3.select("#eraSVG").append("g")
      .attr("id", "eraLabelsGrp")
      .selectAll("div")
      .data([currEra])
      .enter()
      // one div for each object in the array;
    .append("div")
      .attr("id", function(d){
                          return d.label.replace(/\W/g, "") + "Label" })
      .attr("class", "eraLabel")
      .style("position", "absolute")
      .style("z-index", "1")
      .style("text-align", "center")
       // if label fits, position against top-left corner of era with same
      // width; if not, position to left;
      .style("left", function(d){ return getLeftAndStoreWidthVoffset(d); })
      .style("top",  function(d){
                        return (eraTopMargin + (d.topY * eraHeight)) + 10 +
                                d.voffset + "px" })
      .style("width", function(d){ return d.width + "px" })
      .style("font-family", function(d){
                return (d.labelFont ? d.labelFont : fontFamily) })
      .style("font-size", function(d){
                return (d.labelFontSize ? d.labelFontSize : 16) + "px";})
      .style("color", function(d){
                return (d.labelColor ? d.labelColor : "black");})
      .text(function(d){ return d.label });
  d3.select("#overflowSpan").remove();
};  // END drawEraSVG;
/*
d3.tl.buildEraUI();
d3.tl.updateEraUI(d3.tl.currEra);
d3.tl.drawEraSVG(d3.tl.currEra);
*/