/* this is historytimeline.js - July 27, 2014 */

d3.tl = {};

/* =============  Era constructor ====================== */
d3.tl.Era = function (label, start, stop, bgcolor) {
  this.label = label || "Example Label";
  this.start = start || -380;
  this.stop  = stop  || -220;
  this.bgcolor = bgcolor || "#F5BCA9";
  this.topY    = 0;
  this.height  = 1.0;
  this.voffset = 0;
};

/* =============  Timeline constructor ====================== */
d3.tl.Timeline = function (kind) {
  this.title = "Placeholder Title:";
  this.subtitle = "Subtitle Placeholder";
  this.eraTopMargin = 30;
  this.eraHeight = 300;
  this.timeAxisHeight = 50;
  this.svgHeight = this.eraTopMargin + this.eraHeight + this.timeAxisHeight;  // 380
  this.svgWidth = 1200;
  if (kind === "eraUI") { this.svgWidth = 500;};
  this.svgSideMargin = 25;
  this.borderColor = "#A41034"; // Harvard Crimson;
  this.backgroundColor = "bisque";
  // runtime values:
  this.timeScale = null;
  this.containerID = null;
  this.dataOrigin = null;
  this.footerTextBuffer = null;
  
  this.erasArr = [ new d3.tl.Era() ];
  this.eraLabelsFontSize = "16px";
  this.eraLabelsFontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  this.eraLabelTopMargin = 10;
  this.eraDateFontSize = "16px";

  this.containerStyles = {
    "width": (this.svgWidth + 4) + "px",
    "position": "relative",
    "font-family": "Palatino, Times, \"Times New Roman\", Georgia, serif",
    "background-color": "white"
  };
  
  this.footerHTML = "<span class=\"drawnBy\">Drawn by historytimeline.js. " +
                    "(<a href=\"https://github.com/bruml2/historytimeline\">Info " +
                    "and code</a>)</span>";
  this.footerStyles = function () {
               return {"padding": "10px 15px",
                       "margin-top": "20px",
                       "border": "2px solid " + this.borderColor,
                       "font-size": "12px"}
  };
  // can be turned off or on;
  this.hasFooter = true;
  this.hasEraDatesOnHover = true;
  this.hasPrecipEventsOnHover = false;
  this.hasFooterTextOnHover = false;
  this.hasEvents = false;
  this.hasPeople = false;
  this.hasEmblems = false;
  
  this.showingDates = false;
  this.showingAll   = false;
  // D3 selections:
  this.D3svg = null;
  this.D3erasGrp = null;
};

/* =============  Timeline load method ====================== */
d3.tl.Timeline.prototype.loadTimeline = function (tlObj) {
  // each property in tlObj is assigned to that property in this overriding
  // the defaults assigned in the constructor;
  var key;
  for (key in tlObj) {
    if (tlObj.hasOwnProperty(key)) {
      this[key] = tlObj[key];
    }
  }
  // check for features;
  if (this.precipEventsObj) {
    console.log("Found precipEventsObj");
    this.hasPrecipEventsOnHover = true;
  }
  if (this.footerTextObj) {
    console.log("Found footerTextObj");
    this.hasFooterTextOnHover = true;
  }
  if (this.eventsArr) {
    console.log("Found eventsArr");
    this.hasEvents = true;
  }
};

/* =============  Timeline setup methods ====================== */
d3.tl.Timeline.prototype.addHeaderDiv = function (container) {
  this.containerID = container;
  // "this" is set to current selection el in .each loop below;
  var t = this;
  d3.select("#" + container)
      .style(t.containerStyles)
    .append("div")
      .attr("id", container + "-header")
      .style({"padding": "20px 30px",
              "margin-bottom": "20px",
              "border": "2px solid " + t.borderColor
             })
    .each(function() {
      // "this" is redefined as current selection el;
      d3.select(this).append("span")
        .attr("id", container + "-title")
        .style({"font-size": "24px",
                "color": t.borderColor
               })
        .html(t.title);
      d3.select(this).append("span")
        .attr("id", container + "-subtitle")
        .style({"font-size": "18px"})
        .html("&nbsp;&nbsp;" + t.subtitle);
    });
};

d3.tl.Timeline.prototype.addTimelineDiv = function (container) {
  if (this.containerID === null) {
    this.containerID = container;
  } else {
    if (this.containerID !== container) { console.log("Wrong container!"); };
  };
  // grab TimelineObj because "this" is set to current selection el below;
  var t = this;
  this.D3timeline = d3.select("#" + container)
      .style(t.containerStyles)
    .append("div")
      .attr("id", container + "-timeline")
      .attr("class", "historytimeline")
      .style({"position": "relative"})
    .each(function() {
      // inside the <div>, place an svg and a div;
      // "this" is redefined as current selection el;
      d3.select(this).append("svg")
        // .attr("class", "svg")
        .style({"width": t.svgWidth,
                "height": t.svgHeight,
                "border": "2px solid " + t.borderColor,
                "background-color": t.backgroundColor});
      d3.select(this).append("div")
        .attr("class", "precipEventsPanel");
    });
  t.D3svg = d3.select("#" + container + "-timeline svg");            
  t.D3precipEventsPanel =
            d3.select("#" + container + "-timeline .precipEventsPanel");            
  // add the styles once for all timelines on the page;
  if (document.getElementById("globalTimelineStyles") === null) {
    console.log("Adding globalTimelineStyles to body");
    d3.select("body").append("style")
      .attr("id", "globalTimelineStyles")
      .text(".timeAxisGrp path, .timeAxisGrp line {" +
            "  fill: none;" +
            "  stroke: black;" +
            "  shape-rendering: crispEdges; /* SVG attribute */}" +
            ".timeAxisGrp text {" +
            "  font-family: sans-serif;" +
            "  font-size: 13px;" +
            "  text-rendering: optimizeLegibility; /* SVG attribute */}" +
            ".historytimeline .hidden {" +
            "  display: none; }" +
            ".precipEventsPanel {" +            
            "  position: absolute;" +
            "  z-index: 2;" +
            "  border: solid 1px #aaa;" +
            "  border-radius: 8px;" +
            "  background: aliceblue;" +
            "  max-width: 400px;" +
            "  opacity: 0.000001;" +
            "  font: 15px sans-serif;" +
            "  pointer-events: none;}" +
            ".precipEventsPanel p {" +            
            "  margin: 0;" +
            "  padding: 6px}");
  } else {
    console.log("Already have globalTimelineStyles");
  };
};

d3.tl.Timeline.prototype.addFooterDiv = function (container) {
  if (this.containerID === null) {
    this.containerID = container;
  } else {
    if (this.containerID !== container) { console.log("Wrong container!"); };
  };
  d3.select("#" + container)
      .style(this.containerStyles)
    .append("div")
      .attr("id", container + "-footer")
      .style(this.footerStyles())
      .html(this.footerHTML);
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawTimeAxis = function (startYr, stopYr) {
  // set up timescale for x-axis; 
  var minDate = d3.min(this.erasArr, function(d){ return d.start });
  var maxDate = d3.max(this.erasArr, function(d){ return d.stop });
  if (startYr !== null && stopYr !== null && startYr < stopYr) {
    minDate = startYr;
    maxDate = stopYr;
  } else {
    if (startYr !== undefined) {console.log("startYr > stopYr problem")};
  }
  // console.log("min/max: " + minDate + "/" + maxDate);

  this.timeScale = d3.scale.linear()
                          .domain([minDate, maxDate])
                          .rangeRound([this.svgSideMargin,
                                  this.svgWidth - this.svgSideMargin])
                          .nice();
  // timeAxis is a function which returns the SVG elements for the axis;
  var timeAxis = d3.svg.axis()
                       .scale(this.timeScale);
  this.D3svg.append("g")
      .attr("class", "timeAxisGrp")
      // default position is at top of SVG; move to bottom;
      .attr("transform",
            "translate(0, " + (this.eraTopMargin + this.eraHeight + 15) + ")")
      // see relevant CSS styling for path, line, and text;
      .call(timeAxis);
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEras = function (targetEraLabel) {
  // if targetEraLabel is specified, others are 50% opacity;
  // grab TimelineObj because "this" is set to current selection el below;
  var t = this;
  // D3erasGrp is a selection array of all the rects;
  this.D3erasGrp = this.D3svg.append("g")
      .attr("class", "erasGrp")
      .selectAll("rect")
      .data(this.erasArr)
      .enter()
      // one rect for each object in the array; "this" is the rect;
    .append("rect")
      // the id is the label, e.g., "UnitedKingdom" (alphanum only);
      .attr("id", function(d){ return d.label.replace(/\W/g, "") })
      .attr("class", "era")
      .attr("x", function(d){ return t.timeScale(d.start) })
      .attr("y", function(d){ return t.eraTopMargin + (d.topY * t.eraHeight) })
      // slightly rounded corners;
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", function(d){ return t.timeScale(d.stop) -
                                         t.timeScale(d.start) })
      .attr("height", function(d){ return d.height * t.eraHeight })
      .style("fill", function(d){ return d.bgcolor })
      .style("stroke-width", 1)
      .style("stroke", "black")
      // show the two dates and the precipEventsPanel;
      .on("mouseover", function(){
        // console.log("mouseover: " + this.__data__.label);
        if (t.hasEraDatesOnHover && !t.showingAll) {
          // on mouseover of era, select the two start/stop dates whose class
          // is the era's id (the dates are text els) and make them visible;
          var selectorStr = "#" + t.containerID + "-timeline .eraDateGrp ." +
                            d3.select(this).attr("id");
          // console.log(selectorStr);
          d3.selectAll(selectorStr).classed("hidden", false);
        };
        if (t.hasPrecipEventsOnHover && !t.showingAll) {
          // get position and text for the precipEventsPanel; make opaque;
          var eraObj = this.__data__;
          var leftX = t.timeScale(eraObj.start) - 10;
          var topY  = t.eraTopMargin + (eraObj.topY * t.eraHeight) + 46;
          var panelText = t.precipEventsObj[eraObj.start] +
                          t.precipEventsObj[eraObj.stop];
          t.D3precipEventsPanel
              .style("position", "absolute")
              .style("left", leftX + "px")
              .style("top", topY + "px")
              .style("opacity", 1e-6)
              .html(panelText)
            .transition()
              .duration(400)
              .style("opacity", 0.95);
        }
        if (t.hasFooterTextOnHover) {
          var D3footer = d3.select("#" + t.containerID + "-footer");
          t.footerTextBuffer = D3footer.html();
          D3footer
              .html(t.footerTextObj[this.__data__.label])
              // may not be hidden;
              .classed("hidden", false);
        }
      }) // end of mouseover;
      // hide the two dates and the precipEventsPanel;
      .on("mouseout", function(){
        // console.log("mouseout:  " + this.__data__.label);
        if (!t.showingDates && !t.showingAll) {
          var classSelector = ".eraDateGrp ." + d3.select(this).attr("id");
          d3.selectAll(classSelector).classed("hidden", true);
        }
        if (t.hasPrecipEventsOnHover) {
          t.D3precipEventsPanel
              .transition()
              .duration(400)
              .style("opacity", 1e-6);
        }
        if (t.hasFooterTextOnHover) {
          // restore normal footer contents;
          d3.select("#" + t.containerID + "-footer")
              .html(t.footerTextBuffer);
              // .classed("hidden", true);
        }
      });  // end of mouseout;
  if (targetEraLabel) {
    this.D3erasGrp.each(function(d, i) {
      if (this.__data__.label === targetEraLabel) {
        d3.select(this).style("stroke-width", 2);
      } else {
        d3.select(this).style("opacity",0.5);
      }
    });
  };
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEraLabels = function (targetLabel) {
  var t = this;
  // create an invisible span used to measure length of longest word;
  var widthSpan = d3.select("body")
      .append("span")
      .attr("id", "overflowSpan")
      .style("position", "absolute")
      .style("visibility", "hidden");
  function getLeftAndStoreWidthVoffset (d) {
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
    var widthOfEra = t.timeScale(d.stop) - t.timeScale(d.start);
    // console.log("Width of " + d.label + ": " + widthOfEra);
    if (widthOfEra > longestWordWidth) {
      d.width = widthOfEra;
      return t.timeScale(d.start) + "px";
    } else {
      d.width = longestWordWidth + 2;
      var offsetLeft = t.timeScale(d.start) - ((d.width - t.widthOfEra) / 2);
      // console.log("Offset left: " + offsetLeft);
      return offsetLeft + "px";
    }
  } // end of getLeftAndStoreWidthVoffset();
  this.D3timeline.append("g")
      .attr("id", "eraLabelsGrp")
      .selectAll("div")
      .data(this.erasArr)
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
                      return (t.eraTopMargin + (d.topY * t.eraHeight)) +
                             t.eraLabelTopMargin + d.voffset + "px" })
      .style("width", function(d){ return d.width + "px" })
      .style("font-family", function(d){
                return (d.labelFont ? d.labelFont : this.eraLabelsFontFamily) })
      .style("font-size", function(d){
                return (d.labelFontSize ? d.labelFontSize :
                                          t.eraLabelsFontSize) + "px";})
      .style("color", function(d){
                return (d.labelColor ? d.labelColor : "black");})
      .style("opacity", function(d){ if (targetLabel == undefined ||
                                         d.label === targetLabel) {
                return 1} else { return 0.5}; })
      .style("pointer-events", "none")
      .text(function(d){ return d.label });
  // finished with span!
  widthSpan.remove();
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEraDates = function () {
  var t = this;
  // each era gets TWO hidden svg text elements; class == class-of-era;
  // mouseover an era causes the pair to appear;
  // this function is executed twice!        
  function addEraDates (startOrStop) {
    var start = startOrStop == "start" ? true : false;
    t.D3svg.append("g")
        .attr("class", start ? "eraStartDateGrp eraDateGrp" :
                               "eraStopDateGrp eraDateGrp")
        .selectAll("text")
        .data(t.erasArr)
        .enter()
      .append("text")
        .attr("class", function(d){
                                return d.label.replace(/\W/g, "") + " eraDate"})
        // ToDo: use d3 transition to show/hide;
        .classed("hidden", true)
        .attr("text-anchor", "middle")
        .attr("x", function(d){ return t.timeScale(start ? d.start : d.stop); })
        .attr("y", t.eraTopMargin - (0.5 * parseInt(t.eraDateFontSize)))
        .text(function(d){ return start ? d.start : d.stop })
        .attr("font-family", "sans-serif")
        .attr("font-size", t.eraDateFontSize)
        .attr("fill", "black")
        .attr("text-rendering", "optimizeLegibility");
  }
  addEraDates("start");
  addEraDates("stop");
  
  console.log("Num eraDate elements: " +
   d3.selectAll("#" + t.containerID + "-timeline .eraDate")[0].length);   
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEvents = function () {
  var t = this;
  t.D3events = t.D3svg.append("g")
      .attr("class", "eventsGrp")
      .selectAll("circle")
      .data(t.eventsArr)
      .enter()
    .append("circle")
      .style("fill", "#666")
      .attr("id", function(d){ return d.label.replace(/\W/g, "") + "Label" })
      .attr("cx", function(d){ return t.timeScale(d.date) })
      .attr("cy", function(d){ 
                        return (d.centerY * t.eraHeight) + t.eraTopMargin })
      .attr("r",  6)
      .on("mouseover", function(){
        // display the infoPanel under the circle;
        // get position and text for the infoPanel;
        console.log("Event mouseover");
        var d = this.__data__;
        var leftX = t.timeScale(d.date) - 30;
        var topY  = t.eraTopMargin + (d.centerY * t.eraHeight) + 16;
        var panelText = d.label;
        console.log(t.D3precipEventsPanel);
        t.D3precipEventsPanel.style("max-width", "200px")
                 .style("position", "absolute")
                 .style("left", function(d) { return leftX + "px" })
                 .style("top", topY + "px")
                 .style("opacity", 1e-6)
                 .html(panelText)
                .transition()
                 .duration(500)
                 .style("opacity", 0.95);
      })
      .on("mouseout", function(){
        t.D3precipEventsPanel
                 .transition()
                 .duration(500)
                 .style("opacity", 1e-6);
      });
};

/* ======================================================================= */
d3.tl.Timeline.prototype.setup = function (container) {
  // adds to DOM inside container;
  this.addHeaderDiv(container);
  this.addTimelineDiv(container);
  if (this.hasFooter) { this.addFooterDiv(container); };
};

/* ======================================================================= */
d3.tl.Timeline.prototype.draw = function (targetEra) {
  // draws the entire timeline assuming <container>-timeline div;
  this.drawTimeAxis();
  this.drawEras(targetEra);
  this.drawEraLabels(targetEra);
  this.drawEraDates();
  if (this.hasEvents) { this.drawEvents(); };
};

/* ========== END OF CODE ================================================ */
