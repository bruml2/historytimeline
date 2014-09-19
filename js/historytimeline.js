/* this is historytimeline.js - July 27, 2014 */
"use strict";

d3.tl = {};

/* =============  Era constructor ====================== */
d3.tl.Era = function Era(label, start, stop, bgcolor) {
  this.label = label || "Example Label";
  this.start = start || -380;
  this.stop  = stop  || -220;
  this.bgcolor = bgcolor || "#F5BCA9";
  this.topY    = 0;
  this.height  = 1.0;
  // overides timeline-wide values;  (TO DO)
  this.labelFontSize   = null;
  this.labelFontFamily = null;
  this.labelTopMargin  = null;
};

/* =============  Timeline constructor ====================== */
d3.tl.Timeline = function Timeline(kind) {
  this.tlid = null;        // local storage id assigned by Builder;
  this.dataOrigin = null;  // name of individual file containing TL;
  this.scale = 1;
  this.title = "Placeholder Title:";
  this.subtitle = "Subtitle Placeholder";
  this.eraTopMargin = 30;
  this.eraHeight = 300;
  this.timeAxisHeight = 50;
  this.timeAxisTopMargin = 15;
  this.timeAxisFontSize = 13;
  Object.defineProperty(this, "svgHeight", {
    get: function() {
      return this.eraTopMargin + this.eraHeight + this.timeAxisHeight;
    }
  });
  this.svgWidth = 1200;
  if (kind === "eraUI") { this.svgWidth = 500;}
  this.svgSideMargin = 25;
  this.borderColor = "#A41034"; // Harvard Crimson;
  this.backgroundColor = "bisque";
  this.containerFontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  this.containerBackgroundColor = "white";
  this.titleFontSize = 24;
  this.subtitleFontSize = 18;
  this.headerPaddingTop = 20;
  this.headerPaddingSides = 30;
  Object.defineProperty(this, "headerPadding", {
    get: function() {
      return this.headerPaddingTop + "px " + this.headerPaddingSides + "px";
    }
  });
  this.headerMarginBottom = 20;
  this.footerFontSize = 12;
  this.footerPaddingTop = 10;
  this.footerPaddingSides = 15;
  Object.defineProperty(this, "footerPadding", {
    get: function() {
      return this.footerPaddingTop + "px " + this.footerPaddingSides + "px";
    }
  });
  this.footerMarginTop = 20;
  // runtime values:
  this.axisStartYr = null;  // used when not null;
  this.axisStopYr  = null;
  this.timeScale = null;
  this.containerID = null;
  this.oldFooterHTML = null;
  // htlQuizzer runtime values:
  this.quizCorrect = null;
  this.quizIncorrect = null;
  this.quizFudges = null;
  this.remainingLabels = null;
  this.targetLabel = null;
  this.quizTargetEra = null;

  this.erasArr = null;
  this.eraLabelsFontSize = 16;
  this.eraLabelsFontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  this.eraLabelsTopMargin = 10;
  this.eraDateFontSize = 16;

  this.containerStyles = function() {
    return {
      "position": "relative",
      "width": (this.svgWidth + 4) + "px",
      "font-family": this.containerFontFamily,
      "background-color": this.containerBackgroundColor
    };
  };

  this.footerHTML = "<span class=\"drawnBy\">Drawn by historytimeline.js. " +
                    "(<a href=\"https://github.com/bruml2/historytimeline\">Info " +
                    "and code</a>)</span>";

  // can be turned off or on;
  this.hasHeader = true;
  this.hasFooter = true;
  this.hasEraDatesOnHover = true;
  this.hasPrecipEventsOnHover = false;
  this.hasFooterTextOnHover = false;
  this.hasEvents = false;
  this.hasPeople = false;
  this.hasEmblems = false;
  // runtime states (displayControlPanel);
  this.showingDates = false;
  this.showingAll   = false;
  // D3 selections:
  this.D3timeline = null;  // 2nd div inside the container;
  this.D3svg      = null;
  this.D3eras     = null;
  this.D3eraLabelsGrp = null;
  this.D3eraDatesGrps = null;
  // Builder state:
  this.builderMinMax = {}; // props: minDate, maxDate;
  this.created = new Date();
  this.lastModified = new Date();
  // debug:
  this.showD3selectionsInConsole = false;
};

/* =============  Timeline load method ====================== */
d3.tl.Timeline.prototype.loadTimeline = function(tlObj) {
  // NB: any erasArr already on the timeline will be overwritten; therefore, if one
  // wishes to modify the eras provided in a standard timeline, the overriding tl
  // object must provide ALL the eras wanted (none will be preserved from the
  // standard timeline);

  // first, if the tl being loaded has an erasArr, each era is written over an
  // instantiated era containing all possible era properties;
  if (tlObj.erasArr) {
    var newErasArr = tlObj.erasArr.map(function(thisEra, idx, oldEraArr) {
      var newEra = new d3.tl.Era();
      for (key in thisEra) {
        if (thisEra.hasOwnProperty(key)) { newEra[key] = thisEra[key]; }     
      }
      return newEra;
    });
    tlObj.erasArr = newErasArr;
  }
  // each property in tlObj is assigned to that property in "this" overriding
  // the defaults assigned in the constructor;
  var key;
  for (key in tlObj) {
    if (tlObj.hasOwnProperty(key)) {
      this[key] = tlObj[key];
    }
  }

  // check for features;
  if (this.precipEventsObj) {
    // console.log("Found precipEventsObj");
    this.hasPrecipEventsOnHover = true;
  }
  if (this.footerTextObj) {
    // console.log("Found footerTextObj");
    this.hasFooterTextOnHover = true;
  }
  if (this.eventsArr) {
    // console.log("Found eventsArr");
    this.hasEvents = true;
  }
  console.log("Loaded . . .", tlObj);
};

/* =============  Timeline setup methods ====================== */
d3.tl.Timeline.prototype.scaleTimeline = function(scaleBy) {
  // the default width is 1200px; scaleBy arg (0.5 to n);
  var t = this;
  t.scale = scaleBy;
  var scaleable = [
    "eraTopMargin",
    "eraHeight",
    "timeAxisHeight",
    "timeAxisTopMargin",
    "timeAxisFontSize",
    "svgWidth",
    "svgSideMargin",
    "titleFontSize",
    "subtitleFontSize",
    "headerPaddingTop",
    "headerPaddingSides",
    "headerMarginBottom",
    "footerFontSize",
    "footerPaddingTop",
    "footerPaddingSides",
    "footerMarginTop",
    "eraLabelsTopMargin",
    "eraLabelsFontSize",
    "eraDateFontSize"
  ];
  scaleable.forEach(function(prop) {
    // console.log("for ", prop, t[prop], t[prop] * scaleBy);
    t[prop] = t[prop] * scaleBy;
  });
};

d3.tl.Timeline.prototype.styleContainer = function(container) {
  console.log("=== starting " + container + " ===");
  this.containerID = container;
  d3.select("#" + container)
      .style({
        "position": "relative",
        "width": (this.svgWidth + 4) + "px",
        "font-family": this.containerFontFamily,
        "background-color": this.containerBackgroundColor
      });
};

d3.tl.Timeline.prototype.addHeaderDiv = function() {
  // "this" is set to current selection el in .each loop below;
  var t = this;
  d3.select("#" + t.containerID)
    .append("div")
      .attr("id", t.containerID + "-header")
      .style({"padding": t.headerPadding,
              "margin-bottom": t.headerMarginBottom + "px",
              "border": "2px solid " + t.borderColor
             })
    .each(function() {
      // "this" is redefined as current selection el;
      d3.select(this).append("span")
        .attr("id", t.containerID + "-title")
        .style({"font-size": t.titleFontSize + "px",
                "color": t.borderColor
               })
        .html(t.title);
      d3.select(this).append("span")
        .attr("id", t.containerID + "-subtitle")
        .style({"font-size": t.subtitleFontSize + "px"})
        .html("&nbsp;&nbsp;" + t.subtitle);
    });
};

d3.tl.Timeline.prototype.addTimelineDiv = function() {
  // grab TimelineObj because "this" is set to current selection el below;
  var t = this;
  d3.select("#" + t.containerID)
      .style(t.containerStyles)
    .append("div")
      .attr("id", t.containerID + "-timeline")
      .attr("class", "historytimeline")
      .style({"position": "relative"})
      // "this" is redefined as current selection el;
    .append("svg")
      .style({"width": t.svgWidth,
              "height": t.svgHeight,
              "border": "2px solid " + t.borderColor,
              "background-color": t.backgroundColor});
  this.D3timeline = d3.select("#" + t.containerID + "-timeline");
  this.D3svg = d3.select("#" + t.containerID + "-timeline svg");
  // add the styles once for all timelines on the page;
  if (document.getElementById("globalTimelineStyles") === null) {
    d3.select("body").append("style")
      .attr("id", "globalTimelineStyles")
      .text(".timeAxisGrp path, .timeAxisGrp line {" +
            "  fill: none;" +
            "  stroke: black;" +
            "  shape-rendering: crispEdges; /* SVG attribute */}" +
            ".timeAxisGrp text {" +
            "  font-family: sans-serif;" +
            "  font-size: " + t.timeAxisFontSize + "px;" +
            "  text-rendering: optimizeLegibility; /* SVG attribute */}" +
            ".historytimeline .hidden {" +
            "  display: none; }" +
            ".htlPanel {" +
            "  position: absolute;" +
            "  z-index: 2;" +
            "  border: solid 1px #aaa;" +
            "  border-radius: 8px;" +
            "  background: aliceblue;" +
            "  max-width: 400px;" +
            "  opacity: 0.000001;" +
            "  font: 15px sans-serif;" +
            "  pointer-events: none;}" +
            ".htlPanel p {" +
            // "  text-indent: 0.6em;" +
            "  margin: 0;" +
            "  padding: 6px}");
  } else {
    console.log("Already have globalTimelineStyles");
  }
  // If the timeline is scaled, it needs a separate css style for time axis
  // font size;
  if (this.scale !== 1) {
    d3.select("body").append("style")
      .attr("class", "customTimeAxisStyle")
      .text("#" + t.containerID + "-timeline .timeAxisGrp text {" +
            "  font-family: sans-serif;" +
            "  font-size: " + t.timeAxisFontSize + "px;" +
            "  text-rendering: optimizeLegibility; /* SVG attribute */}");
  }
};

d3.tl.Timeline.prototype.addFooterDiv = function() {
  var t = this;
  d3.select("#" + t.containerID)
      .style(this.containerStyles)
    .append("div")
      .attr("id", t.containerID + "-footer")
      .style({"padding": t.footerPadding,
              "margin-top": t.footerMarginTop + "px",
              "border": "2px solid " + this.borderColor,
              "font-size": t.footerFontSize + "px",
              "text-indent": "0.6em"})
      .html(this.footerHTML);
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawTimeAxis = function() {
  // set up timescale for x-axis;
  // if axisStartYr and axisStopYr are not null, then use those values instead of computing from eras (e.g., empty timeline or during building;
  var minDate, maxDate;
  if (this.axisStartYr !== null && this.axisStopYr !== null) {
    minDate = this.axisStartYr;
    maxDate = this.axisStopYr;
  } else {
    minDate = d3.min(this.erasArr, function(d) { return d.start });
    maxDate = d3.max(this.erasArr, function(d) { return d.stop });
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
            "translate(0, " + (this.eraTopMargin + this.eraHeight +
                             this.timeAxisTopMargin) + ")")
      // see relevant CSS styling for path, line, and text;
      .call(timeAxis);
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEras = function(targetEraLabel) {
  // if targetEraLabel is specified, others are 50% opacity;
  // grab TimelineObj because "this" is set to current selection el below;
  var t = this;
  // D3eras is a selection of all the rects;
  this.D3eras = this.D3svg.append("g")
      .attr("class", "erasGrp")
      .selectAll("rect")
      .data(this.erasArr)
      .enter()
      // one rect for each object in the array; "this" is the rect;
    .append("rect")
      // the id is the label, e.g., "UnitedKingdom" (alphanum only);
      .attr("id", function(d) { return t.containerID + "-" +
                                       d.label.replace(/\W/g, "") + "Era" })
      .attr("class", "era")
      .attr("x",  function(d) { return t.timeScale(d.start) })
      .attr("y",  function(d) { return t.eraTopMargin + (d.topY * t.eraHeight) })
      // slightly rounded corners;
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width",  function(d) { return t.timeScale(d.stop) -
                                           t.timeScale(d.start) })
      .attr("height", function(d) { return d.height * t.eraHeight })
      .style("fill",  function(d) { return d.bgcolor })
      .style("stroke-width", 1)
      .style("stroke", "black")
      // show the two dates and the precipEventsPanel;
      .on("mouseover", eraMouseover)
      .on("mouseout", eraMouseout);
      
  // if there is a targetEraLabel, mark it and reduce the opacity of all the other eras;
  if (targetEraLabel) {
    this.D3eras.each(function(d, i) {
      if (this.__data__.label === targetEraLabel) {
        d3.select(this).style("stroke-width", 2);
      } else {
        d3.select(this).style("opacity", 0.5);
      }
    });
  }
  // htlPanel class defines the global CSS;
  this.D3timeline.append("div")
    .attr("class", "htlPanel");
  this.D3panel =
            d3.select("#" + this.containerID + "-timeline .htlPanel");
            
  function eraMouseover() {
    // console.log("mouseover: ", this.__data__.label);
    if (t.hasEraDatesOnHover && !t.showingAll) {
      // on mouseover of era, select the two start/stop dates whose class
      // is the era's id (the dates are text els) and make them visible;
      var selectorStr = "#" + t.containerID + "-timeline .eraDateGrp ." +
        this.__data__.label.replace(/\W/g, "");
      // console.log(selectorStr);
      d3.selectAll(selectorStr).classed("hidden", false);
    }
    if (t.hasPrecipEventsOnHover && !t.showingAll) {
      // get position and text for the precipEventsPanel; make opaque;
      var eraObj = this.__data__;
      var leftX = t.timeScale(eraObj.start) - 10;
      var topY  = t.eraTopMargin + (eraObj.topY * t.eraHeight) + 46;
      var panelText = t.precipEventsObj[eraObj.start] +
                      t.precipEventsObj[eraObj.stop];
      t.D3panel
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
      t.oldFooterHTML = D3footer.html();
      var newHTML = t.footerTextObj[this.__data__.label];
      // if text is long, break into three columns;
      if (newHTML.length > 200) {
        D3footer.style("-webkit-column-count","3");
      }
      D3footer
          .html(newHTML)
          // usually not hidden;
          .classed("hidden", false);
    }
  }
            
  function eraMouseout() {
    // hide the two dates and the precipEventsPanel;
    // console.log("mouseout:  " + this.__data__.label);
    if (!t.showingDates && !t.showingAll && t.hasEraDatesOnHover) {
      var selectorStr = "#" + t.containerID + "-timeline .eraDateGrp ." +
        this.__data__.label.replace(/\W/g, "");
      d3.selectAll(selectorStr).classed("hidden", true);
    }
    if (t.hasPrecipEventsOnHover) {
      t.D3panel
          .transition()
          .duration(400)
          .style("opacity", 1e-6);
    }
    if (t.hasFooterTextOnHover) {
      // restore normal footer contents;
      d3.select("#" + t.containerID + "-footer")
          .style("-webkit-column-count","1")
          .html(t.oldFooterHTML);
          // .classed("hidden", true);
    }
  }
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEraLabels = function(targetLabel) {
  var t = this;
  // create an invisible div to contain spans used to measure length of
  // longest word;
  d3.select("body")
      .append("div")
      .attr("id", "widthSpanContainer")
      .style("font-family", t.eraLabelsFontFamily)
      .style("font-size", t.eraLabelsFontSize + "px")
      .style("visibility", "hidden");
  function getLeftAndStoreWidth(d) {
    /* this function: returns the x-coordinate of the HTML <div> which will
       contain the label (if label is wider than era then must shift div left);
       finds the longest word; gets its width; tests whether wider than the era;
       if not, returns the x-coorinate of the era-start; if so, returns the
       x-coordinate for the wider <div>; stores the width of the <div> in d
       (the eraObj):
    */
    // does widest word overflow? Sort by length descending;
    var words = d.label.split(/ /);
    var longestWord =
            words.sort(function(a, b) { return b.length - a.length; })[0];
    // console.log("Longest: " + longestWord);
    // create a span to measure width of widest word;
    var widthSpan = document.createElement('span');
    widthSpan.setAttribute('style', 'font-family: ' + t.eraLabelsFontFamily +
            '; font-size: ' + t.eraLabelsFontSize + 'px');
    widthSpan.innerHTML = longestWord;
    var cont = document.getElementById('widthSpanContainer');
    cont.appendChild(widthSpan);
    // console.log("lastChild.offsetWidth: " + cont.lastChild.offsetWidth);
    // console.log("lastChild.clientWidth: " + cont.lastChild.clientWidth);
    // NTTB: clientWidth returns 0;
    var longestWordWidth = cont.lastChild.offsetWidth;
    // console.log("Width of " + longestWord + ": " + longestWordWidth);
    var widthOfEra = t.timeScale(d.stop) - t.timeScale(d.start);
    // console.log("Width of " + d.label + " era: " + widthOfEra);
    if (widthOfEra > longestWordWidth) {
      d.width = widthOfEra;
      // console.log("Fits; returning: " + t.timeScale(d.start) + "px");
      return t.timeScale(d.start) + "px";
    } else {
      // console.log("Does NOT fit:");
      d.width = longestWordWidth + 2;
      // console.log("Normal: " + t.timeScale(d.start));
      // console.log("  minus: " + ((d.width - widthOfEra) / 2));
      var offsetLeft = t.timeScale(d.start) - ((d.width - widthOfEra) / 2);
      // console.log("  Offset left: " + offsetLeft);
      return offsetLeft + "px";
    }
  } // end of getLeftAndStoreWidthVoffset();
  // NB that labels do NOT go into svg element but after it;
  this.D3timeline.append("g")
      .attr("class", "eraLabelsGrp")
      .selectAll("div")
      .data(this.erasArr)
      .enter()
      // one div for each object in the array;
    .append("div")
       // used to hide a single label for quizzes;
      .attr("id", function(d) {
        return t.containerID + "-" + d.label.replace(/\W/g, "") + "Label" })
      .attr("class", "eraLabel")
      .style("position", "absolute")
      .style("z-index", "1")
      .style("text-align", "center")
      // if label fits, position against top-left corner of era with same
      // width; if not, position to left;
      .style("left", function(d) { return getLeftAndStoreWidth(d); })
      .style("top",  function(d) {
            return (t.eraTopMargin + (d.topY * t.eraHeight)) +
                    (d.labelTopMargin ? d.labelTopMargin : t.eraLabelsTopMargin) + "px" })
      .style("width", function(d) { return d.width + "px" })
      .style("font-family", function(d) {
                return (d.labelFontFamily ? d.labelFontFamily :
                                            this.eraLabelsFontFamily) })
      .style("font-size", function(d) {
                return (d.labelFontSize ? d.labelFontSize :
                                          t.eraLabelsFontSize) + "px";})
      .style("color", function(d) {
                return (d.labelColor ? d.labelColor : "black");})
      .style("opacity", function(d) { if (targetLabel == undefined ||
                                         d.label === targetLabel)
                                       { return 1; } else { return 0.5; } })
      .style("pointer-events", "none")
      .text(function(d) { return d.label });
  // grab the group itself for later delete;
  this.D3eraLabelsGrp = d3.select("#" + this.containerID + "-timeline .eraLabelsGrp");

  // finished with widthSpanContainer!
  d3.select("#widthSpanContainer").remove();
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEraDates = function() {
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
        .attr("class", function(d) {
                                return d.label.replace(/\W/g, "") + " eraDate"})
        // ToDo: use d3 transition to show/hide;
        .classed("hidden", true)
        .attr("text-anchor", "middle")
        .attr("x", function(d) { return t.timeScale(start ? d.start : d.stop); })
        .attr("y", t.eraTopMargin - (0.5 * parseInt(t.eraDateFontSize)))
        .text(function(d) { return start ? d.start : d.stop })
        .attr("font-family", "sans-serif")
        .attr("font-size", t.eraDateFontSize)
        .attr("fill", "black")
        .attr("text-rendering", "optimizeLegibility");
  }
  addEraDates("start");
  addEraDates("stop");

  this.D3eraDatesGrps =
             d3.selectAll("#" + t.containerID + "-timeline .eraDateGrp");
  // console.log("Num eraDate elements: " +
  //  d3.selectAll("#" + t.containerID + "-timeline .eraDate")[0].length);
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEvents = function() {
  var t = this;
  t.D3events = t.D3svg.append("g")
      .attr("class", "eventsGrp")
      .selectAll("circle")
      .data(t.eventsArr)
      .enter()
    .append("circle")
      .style("fill", "#666")
      .attr("id", function(d) { return d.label.replace(/\W/g, "") + "Label" })
      .attr("cx", function(d) { return t.timeScale(d.date) })
      .attr("cy", function(d) {
                        return (d.centerY * t.eraHeight) + t.eraTopMargin })
      .attr("r",  6)
      .on("mouseover", function() {
        // display the infoPanel under the circle;
        // get position and text for the infoPanel;
        console.log("Event mouseover");
        var eraObj = this.__data__;
        var leftX = t.timeScale(eraObj.date) - 30;
        var topY  = t.eraTopMargin + (eraObj.centerY * t.eraHeight) + 16;
        var panelText = eraObj.label;
        console.log(t.D3panel);
        t.D3panel.style("max-width", "200px")
                 .style("position", "absolute")
                 // .style("left", function(d) { return leftX + "px" })
                 .style("left", leftX + "px")
                 .style("top", topY + "px")
                 .style("opacity", 1e-6)
                 .html(panelText)
                .transition()
                 .duration(500)
                 .style("opacity", 0.95);
      })
      .on("mouseout", function() {
        t.D3panel.transition()
                 .duration(500)
                 .style("opacity", 1e-6);
      });
};

/* ======================================================================= */
d3.tl.Timeline.prototype.setup = function(container) {
  if (this.scale !== 1) { this.scaleTimeline(this.scale); }
  // adds to DOM inside container;
  this.styleContainer(container);
  if (this.hasHeader) { this.addHeaderDiv(); }
  this.addTimelineDiv();
  if (this.hasFooter) { this.addFooterDiv(); }
};

/* ======================================================================= */
d3.tl.Timeline.prototype.draw = function(targetEra) {
  // draws the entire timeline assuming <container>-timeline div;
  this.drawTimeAxis();
  this.drawEras(targetEra);
  this.drawEraLabels(targetEra);
  if (this.hasEraDatesOnHover) { this.drawEraDates(); }
  if (this.hasEvents) { this.drawEvents(); }

  // d3.select("#ideasBasicContainer-JewishApocalypticismEra").trigger("mouseover");

  // debug:
  if (this.showD3selectionsInConsole === true) {
    console.log("D3timeline: ", this.D3timeline);
    console.log("D3svg: ", this.D3svg);
    console.log("D3eras: ", this.D3eras);
    console.log("D3eraLabelsGrp: ", this.D3eraLabelsGrp);
    console.log("D3eraDatesGrps: ", this.D3eraDatesGrps);
  }
};

/* ======================================================================= */
d3.tl.drawTimelineInContainer = function(timelineRef, containerID, overrideObj) {
  // the timeline arg may be:
  //  3) a string which matches the tlid of a timeline in the database (TODO);
  //  4) a value which matches the tlid of a timeline in the database (TODO);
  // the containerID arg is a string: the id of the container <div>;
  // NB: this one-call interface only works for a single timeline on the page;
  var tlMap = {
    "HBoverview1": "9dcb7169221a03d8234ed9ee7000021b",
    "HBideasBasic1": "76c15ecd14a7b61d60e5b1d835000639",
    "HBprophets1": "cef3c17177f31e9f2c4734f1e2000690"
  };
  // if the timeline data is not already a d3.tl object, then do what's
  // necessary to create it here (probably just d3.json(...));
  if (typeof timelineRef === "string") {
    // could be json filename; could be TL title;
    if (timelineRef.substr(-5) === ".json") {
      d3.json(timelineRef, function(error, tlObj) {
        if (error) { console.log("Error in json: " + error); }
        var UUID = getUUID();
        d3.tl[UUID] = new d3.tl.Timeline();
        d3.tl[UUID].loadTimeline(tlObj);
        if (overrideObj) { loadOverrides(UUID, overrideObj); }
        console.dir(d3.tl[UUID]);
        d3.tl[UUID].setup(containerID);
        d3.tl[UUID].draw();
      });
    } else if (tlMap[timelineRef]){
      // fetch from DB and continue;
      console.log("DB URL: " + "http://historytimelines.iriscouch.com/tl/" + tlMap[timelineRef]);
      d3.json("http://historytimelines.iriscouch.com/tl/" + tlMap[timelineRef], function(error, dbObj) {
        if (error) return console.warn(error);
        console.log("DB Obj: ", dbObj);
        console.log("DB tl Obj: ", dbObj.tl);
        var UUID = getUUID();
        d3.tl[UUID] = new d3.tl.Timeline();
        d3.tl[UUID].loadTimeline(dbObj.tl);
        if (overrideObj) { loadOverrides(UUID, overrideObj); }
        console.dir(d3.tl[UUID]);
        d3.tl[UUID].setup(containerID);
        d3.tl[UUID].draw();
      });
    } else {
      throw error("bad argument: should be *.json or a DB tlid");
    }
  } else if (typeof d3.tl[timelineRef] === "object") {
    // this is not yet tested and is probably a bad idea;
    d3.tl[UUID].loadTimeline(timelineObj);
  }

  function getUUID() {
    return performance.now().toString().substr(-9);
  }
  
  function loadOverrides(UUID, overrideObj) { 
    if (typeof(overrideObj) === "object") {
      d3.tl[UUID].loadTimeline(overrideObj);
    } else {
      // should be an array of such objects;
      overrideObj.forEach(function(arrItem) {
        d3.tl[UUID].loadTimeline(arrItem);
      });
    }
  }
};

/* ======================================================================= */
d3.tl.Timeline.prototype.initQuiz = function(difficulty) {
  // creates array of labels; stores orig value of erasArr;
  this.hasEraDatesOnHover = false;
  this.hasPrecipEventsOnHover = false;
  this.hasFooterTextOnHover = false;
  this.quizCorrect = 0;
  this.quizIncorrect = 0;
  this.quizFudges = 0;
  this.remainingLabels = [];
  // second arg sets value of this within callback (else undefined!);
  this.erasArr.forEach(function(era) {
    this.remainingLabels.push(era.label);
  }, this);

  // add quizPanel to DOM;
  var t = this;
  d3.select("#" + this.containerID).append("div")
    .attr("id", this.containerID + "-quizPanel")
    .style({"position": "absolute",
            "left": "400px",
            "top": "10px",
            "padding": "20px 40px",
            // z-index?
            "text-align": "center",
            "border": "4px solid red",
            "border-radius": "8px",
            "background-color": "aliceblue"
          })
    .each(function() {
      // "this" is redefined as current selection el;
      d3.select(this).append("p")
        .style({"margin-top": "0",
                "margin-bottom": "0.5em"
               })
        .html("What is the name of the era with the <span style=\"color: red;\">red</span> star?");
      d3.select(this).append("input")
        .attr("type", "text")  // default;
        .attr("id", this.containerID + "-quizTextbox")
        .attr("placeholder", "type answer here")
        .attr("size", "20")
        .style({"padding-left": "0.3em",
                "font-size": "36px"})
        // missing quizTextbox:focus CSS:
        // border: 5px solid red; border-radius: 10px;
        .on("input", function() {
          var textboxEl = this;
          if (this.value === t.targetLabel ||
              t.answerIsCloseEnough(this.value, t.targetLabel)) {
            // add tilted green "YES" for two seconds;
            d3.select("#" + t.containerID + "-quizPanel").append("span")
              .attr("class", "quizPanelYES")
              .style({"position": "absolute",
                      "left": "100px",
                      "top": "30px",
                      "font-size": "72px",
                      "font-weight": "bold",
                      "color": "green"
                      // rotate -30deg;
                     })
              .html("YES");
            // after two seconds, remove YES and empty textbox;
            setTimeout(function() {
              textboxEl.value = "";
              d3.select("#" + t.containerID +
                              "-quizPanel .quizPanelYES").remove();
            }, 2000);
            t.quizCorrect++;
            console.log("Correct: " + t.quizCorrect);
            // color is currently hard-coded black;
            var targetLabelD3 = d3.select("#" + t.containerID + "-" +
                                  t.targetLabel.replace(/\W/g, "") + "Label");
            targetLabelD3.style("color", "black");

            if (t.remainingLabels.length > 7) {  // production: 0;
              t.nextQuizItem();
            } else {
              t.scoreQuiz();
            }
          }
          // don't yet have the right answer;
        })
        .on("keypress", function() {
          // "d3.event" is a Keyboard Event;
          // hit return, so answer must be wrong;
          if (d3.event.keyCode === 13) {
            t.quizIncorrect++;
            console.log("Incorrect: " + t.quizIncorrect);
            if (t.remainingLabels.length > 7) {  // production: 0;
              t.nextQuizItem();
            } else {
              t.scoreQuiz();
            }
          }
        });
    }); // END of each;

  this.nextQuizItem();
};

/* ======================================================================= */
d3.tl.Timeline.prototype.nextQuizItem = function() {
  this.targetLabel = this.remainingLabels.shift();
  // hide targetLabel with CSS:
  var targetLabelD3 = d3.select("#" + this.containerID + "-" +
         this.targetLabel.replace(/\W/g, "") + "Label");
  targetLabelD3.style("color", "transparent");
  // add red star to era: SVG drawing!
  this.targetEraD3 = d3.select("#" + this.containerID + "-" +
         this.targetLabel.replace(/\W/g, "") + "Era");
  //set up panel from previous item;
  // value = ""
  // focus;
};

/* ======================================================================= */
d3.tl.Timeline.prototype.answerIsCloseEnough = function(answer, label) {
  var labelToAnswerMap = {
    // the answer is compared after conversion to lower-case;
    "Judges": ["the judges", "thejudges", "jugdes"],
    "United Kingdom": ["united monarchy", "unitedkingdom", "unitedmonarchy"],
    "Northern Kingdom (Israel)": ["northernkingdom", "kingdom of israel"],
    "Southern Kingdom (Judah)": ["southernkingdom", "kingdom of judah"],
    "Exile": ["babylonia", "babylonianexile"],
    "Persian Period": ["persian", "persianperiod"],
    "Hellenistic Period": ["hellenistic", "hellenisticperiod", "greek"],
    "Maccabean (Hasmonean) Rule": ["maccabean", "hasmonean", "maccabeanrule",
      "maccabean rule", "hasmonean rule", "hasmoneanrule"],
    "Rome: Temple": ["rome", "rometemple", "romewithtemple", "romeandtemple"]
  };
  // ignore case:
  var lcAnswer = answer.toLowerCase();
  var lcLabel = label.toLowerCase();
  console.log(label, labelToAnswerMap[label], lcAnswer, lcLabel);
  if (lcAnswer === lcLabel) { this.quizFudges++; return true; }
  if (labelToAnswerMap[label].indexOf(lcAnswer) > -1) {
    console.log("found: " +
            labelToAnswerMap[label][labelToAnswerMap[label].indexOf(lcAnswer)]);
    this.quizFudges++; return true;
  }
  return false;
};

/* ======================================================================= */
d3.tl.Timeline.prototype.scoreQuiz = function() {
  var scoreHTML = "Nice job! You got all the answers.";
  // add scorePanel to DOM;
  var t = this;
  d3.select("#" + this.containerID).append("div")
    .attr("id", this.containerID + "-scorePanel")
    .style({"position": "absolute",
            "left": "400px",
            "top": "10px",
            "padding": "20px 40px",
            // z-index?
            "text-align": "center",
            "border": "4px solid blue",
            "border-radius": "8px",
            "background-color": "aliceblue"
          })
    .each(function() {
      // "this" is redefined as current selection el;
      d3.select(this).append("p")
        .style({"margin-top": "0",
                "margin-bottom": "0.5em"
               })
        .html(scoreHTML);
      d3.select(this).append("button")
        .attr("type", "button")  // default is submit;
        .attr("id", this.containerID + "-quizBtn")
        .attr("value", "OK")
        .style({"position": "absolute",
                "left": "400px",
                "top": "40px",
                "padding": "0.3em",
                "font-size": "20px"})
        // missing quizTextbox:focus CSS:
        // border: 5px solid red; border-radius: 10px;
        .on("input", function() {
          var textboxEl = this;
        });
    }); // END of each;
  console.log("END");
};

/* ======================================================================= */
// this function is not currently used (or tested);
d3.tl.Timeline.prototype.removeTimelineContents = function() {
  // delete contents of svg;
  var svg = document.querySelector("#" + this.containerID + "-timeline svg");
  while (svg.firstChild) {
    // console.log("Removing from svg: ", svg.firstChild);
    svg.removeChild(svg.firstChild);
  }
  // delete precipEventsPanel;
  d3.select("#" + this.containerID + "-timeline .precipEventsPanel").remove();
  // delete eraLabelsGrp;
  d3.select("#" + this.containerID + "-timeline .eraLabelsGrp").remove();
};

/* =============  Panel constructor ====================== */
d3.tl.Panel = function(selector, kind) {
  this.D3selection = d3.select(selector);
  this.kind = kind;
  this.style = {
  };
  switch (kind) {
    case "precipEvents":
      break;
    case "quiz":
      break;
    case "quizScore":
      break;
    default:
      throw error;
  }
  
};

d3.tl.Panel.prototype.drawAndShow = function() {
};

/* =============  couchdb tests ====================== */
d3.tl.checkDB = function(container) {
  var tlMap = {
    "HBoverview1": "9dcb7169221a03d8234ed9ee7000021b"
  };
  console.log("Checking DB");
  // for custom headers: add ".header("foo", "bar");
  d3.json("http://historytimelines.iriscouch.com/").get(function(error, resp) {
    if (error) return console.warn(error);
    console.log(resp);
    console.log(resp.couchdb);
    d3.select("#" + container).append("div").attr("id", "couchresp").html(resp.couchdb);
  });
  
  d3.json("http://historytimelines.iriscouch.com/tl/9dcb7169221a03d8234ed9ee7000021b", function(error, resp) {
    if (error) return console.warn(error);
    console.log(resp);
    console.log(resp.tl);
    console.log(resp["tl"]);
  });
};
/*
http://127.0.0.1:5984/_uuids  =>  {"uuids":["6e1295ed6c29495e54cc05947f18c8af"]}


*/
/* ========== END OF CODE ================================================ */
