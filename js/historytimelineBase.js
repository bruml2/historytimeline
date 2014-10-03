/* this is historytimelineBase.js (eras and precipEvents only) */
/* begun September 18, 2014 */

/* TO DO: 1) pePanelOffsets; 2) axisStartYr; 3) line 281 panel text-indent */

"use strict";

d3.tl = {};

/* =============  Timeline constructor ====================== */
d3.tl.Timeline = function Timeline() {
  this.tlid = null;        // local storage id assigned by Builder;
  this.dataOrigin = null;  // name of individual file containing TL;
  this.scale = 1;
  // to remove the header: set title and subtitle to null string;
  this.title = "Placeholder Title:";
  this.subtitle = "Subtitle Placeholder";
  this.headerText = "";
  this.eraTopMargin = 30;
  this.eraHeight = 300;
  this.timeAxisHeight = 50;
  this.timeAxisTopMargin = 15;
  this.timeAxisFontSize = 13;
  this.axisStartYr = null;  // used when not null;
  this.axisStopYr  = null;
  Object.defineProperty(this, "svgHeight", {
    get: function() {
      return this.eraTopMargin + this.eraHeight + this.timeAxisHeight;
    }
  });
  this.svgWidth = 1200;
  this.svgSideMargin = 25;
  this.borderColor = "#A41034"; // Harvard Crimson;
  this.backgroundColor = "bisque";
  this.containerFontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  this.containerBackgroundColor = "white";
  this.titleFontSize = 24;
  this.subtitleFontSize = 18;
  this.headerPaddingTop = 14;
  this.headerPaddingSides = 22;
  Object.defineProperty(this, "headerPaddingCSS", {
    get: function() {
      return this.headerPaddingTop + "px " + this.headerPaddingSides + "px";
    }
  });
  this.headerMarginBottom = 20;
  this.headerTextFontSize = 18;
  this.headerTextPaddingTop = 14;
  this.headerTextPaddingSides = 10;
  Object.defineProperty(this, "headerTextPaddingCSS", {
    get: function() {
      return this.headerTextPaddingTop + "px 0 0 " +
             this.headerTextPaddingSides + "px";
    }
  });
  this.footerFontSize = 12;
  this.footerPaddingTop = 10;
  this.footerPaddingSides = 15;
  Object.defineProperty(this, "footerPaddingCSS", {
    get: function() {
      return this.footerPaddingTop + "px " + this.footerPaddingSides + "px";
    }
  });
  this.footerMarginTop = 20;

  this.erasArr = null;
  this.eraLabelsFontSize = 16;
  this.eraLabelsFontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  this.eraLabelsTopMargin = 10;
  this.eraDateFontSize = 16;

  this.pePanelFontSize = 15;
  this.footerHTML = "<span>Drawn by historytimeline.js. " +
                    "(<a href=\"https://github.com/bruml2/historytimeline\">Info " +
                    "and code</a>)</span>";

  // can be turned off or on;
  this.hasEraDatesOnHover = true;
  this.hasPrecipEventsOnHover = false;
  // runtime values:
  this.containerID = null;
  this.timeScale   = null;    // needed for later scaling (eras);
  this.oldFooterHTML = null;
  // runtime states (displayControlPanel);
  this.showingDates = false;
  this.showingAll   = false;
  // D3 selections:
  this.D3timeline     = null;  // 2nd div inside the container;
  this.D3svg          = null;
  this.D3eras         = null;
  this.D3eraLabelsGrp = null;
  this.D3eraDatesGrps = null;
};

/* =============  Era constructor ====================== */
/*
   A "normal" era has era dates on hover, optional precipEvents,
   and does not have footerText.
   An era which looks like a range (horizontal bar) usually has
   footerText; its label is centered vertically with labelTopMargin;
*/
d3.tl.Era = function Era(label, start, stop, bgcolor) {
  this.label = label || "Example Label";
  this.start = start || -380;
  this.stop  = stop  || -220;
  this.bgcolor = bgcolor || "#F5BCA9";
  this.topY    = 0;
  this.height  = 1.0;
  this.footerText = null;
  // overides timeline-wide values;  (TO DO)
  this.pePanelXOffset = 0;  // offset from default;
  this.pePanelYOffset = 0;
  this.labelFontSize   = null;
  this.labelFontFamily = null;
  this.labelTopMargin  = null;  // overrides eraLabelsTopMargin of 10;
};

/* =============  loadTimeline method ====================== */
d3.tl.Timeline.prototype.loadTimeline = function(tlObj) {
  // NB: any erasArr already on the timeline will be overwritten; therefore,
  // if one wishes to modify the eras provided in a standard timeline
  // (already loaded), the overriding tl object must provide ALL the eras
  // wanted (none will be preserved from the standard timeline);

  // first, if the tl being loaded has an erasArr, each era is written over an
  // instantiated era containing all possible era properties; also ranges;
  if (tlObj.erasArr !== undefined) {
    tlObj.erasArr = getNewErasObjArr(tlObj.erasArr);
  }
  /* DELETE
  if (tlObj.rangesArr !== undefined) {
    tlObj.rangesArr = getNewErasObjArr(tlObj.rangesArr);
    tlObj.rangesArr.forEach(function(thisRange) {
      thisRange.isRange = true;
    });
  }
  */
  // each property in tlObj is assigned to that property in "this" overriding
  // the defaults assigned in the constructor; Note need for 2nd arg to set
  // value of "this" in function.
  Object.keys(tlObj).forEach(function(key) {
    if (tlObj.hasOwnProperty(key)) { this[key] = tlObj[key]; }
  }, this);

  // check for features;
  if (this.precipEventsObj) { this.hasPrecipEventsOnHover = true; }
  if (this.eventsArr)       { this.hasEvents = true; }
  
  function getNewErasObjArr(oldArr) {
    return oldArr.map(function(thisEra) {
      var newEra = new d3.tl.Era();
      Object.keys(thisEra).forEach(function(key) {
        if (thisEra.hasOwnProperty(key)) { newEra[key] = thisEra[key]; }     
      });
      return newEra;
    });
  }
  
  console.log("Loaded . . .", tlObj);
};

/* =============  scaleTimeline method ====================== */
d3.tl.Timeline.prototype.scaleTimeline = function(scaleBy) {
  // the default svgWidth is 1200px; scaleBy arg (0.5 to n);
  this.scale = scaleBy;
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
    this[prop] = this[prop] * scaleBy;
  }, this);
  // handle erasArr: pePanelXOffset;
  if (this.erasArr) {
    this.erasArr.forEach(function(era) {
      if (era.pePanelXOffset !== null) {
        era.pePanelXOffset = era.pePanelXOffset * scaleBy;
      }
      if (era.pePanelYOffset !== null) {
        era.pePanelYOffset = era.pePanelYOffset * scaleBy;
      }
    });
  }
};

/* =============  setContainer method ====================== */
d3.tl.Timeline.prototype.setContainer = function(container) {
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

/* =============  addHeaderDiv method ====================== */
d3.tl.Timeline.prototype.addHeaderDiv = function() {
  var t = this;
  d3.select("#" + t.containerID)
    .append("div")
      .attr("id", t.containerID + "-header")
      .style({"padding": t.headerPaddingCSS,
              "margin-bottom": t.headerMarginBottom + "px",
              "border": "2px solid " + t.borderColor
             })
    .each(function() {
      // "this" is redefined as current selection el (the <div>);
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
      if (t.headerText !== "") {
        d3.select(this).append("div")
          .attr("id", t.containerID + "-headerText")
          .style({"font-size": t.headerTextFontSize + "px",
                  "padding": t.headerTextPaddingCSS,
                  // "border": "1px solid red"
          })
          .html(t.headerText);
      }
    });
};

/* =============  addTimelineDiv method ====================== */
d3.tl.Timeline.prototype.addTimelineDiv = function() {
  var t = this;
  d3.select("#" + t.containerID)
    .append("div")
      .attr("id", t.containerID + "-timeline")
      .attr("class", "historytimeline")
      .style({"position": "relative"})
    .append("svg")
      .style({"width": t.svgWidth,
              "height": t.svgHeight,
              "border": "2px solid " + t.borderColor,
              "background-color": t.backgroundColor});
  this.D3timeline = d3.select("#" + t.containerID + "-timeline");
  this.D3svg      = d3.select("#" + t.containerID + "-timeline svg");
  // add the styles once for all timelines on the page;
  if (document.getElementById("globalTimelineStyles") === null) {
    d3.select("body").append("style")
      .attr("id", "globalTimelineStyles")
      .text(".timeAxisGrp path, .timeAxisGrp line {" +
            "  fill: none;" +
            "  stroke: black;" +
            "  shape-rendering: crispEdges; /* SVG attribute */}" +
            ".timeAxisGrp text {" +
            "  font: " + t.timeAxisFontSize + "px sans-serif;" +
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
            "  font: " + t.pePanelFontSize + "px sans-serif;" +
            "  pointer-events: none;}" +
            ".htlPanel p {" +
            // "  text-indent: 0.6em;" +
            "  margin: 0;" +
            "  padding: 6px}");
  }
  // If the timeline is scaled, need separate styles for scaled values ;
  if (t.scale !== 1) {
    var scaledTimeAxisFontSize = t.timeAxisFontSize * t.scale;
    var scaledPanelFontSize = t.pePanelFontSize * t.scale;
    d3.select("body").append("style")
      .attr("class", "scaledStyles")
      .text("#" + t.containerID + "-timeline .timeAxisGrp text {" +
            "  font: " + scaledTimeAxisFontSize + "px sans-serif;" +
            "  text-rendering: optimizeLegibility; /* SVG attribute */}" +
            "#" + t.containerID + "-timeline .htlPanel {" +
            "  font: " + scaledPanelFontSize + "px sans-serif;}");
  }
};

/* =============  addFooterDiv method ====================== */
d3.tl.Timeline.prototype.addFooterDiv = function() {
  var t = this;
  d3.select("#" + t.containerID)
    .append("div")
      .attr("id", t.containerID + "-footer")
      .style({"padding": t.footerPaddingCSS,
              "margin-top": t.footerMarginTop + "px",
              "border": "2px solid " + this.borderColor,
              "font-size": t.footerFontSize + "px",
              "text-indent": "0.6em"})
      .html(this.footerHTML);
};

/* =============  drawTimeAxis method ====================== */
d3.tl.Timeline.prototype.drawTimeAxis = function() {
  // if axisStartYr and axisStopYr are not null, then use those values
  // instead of computing from eras;
  var minDate, maxDate;
  if (this.axisStartYr !== null && this.axisStopYr !== null) {
    minDate = this.axisStartYr;
    maxDate = this.axisStopYr;
  } else {
    minDate = d3.min(this.erasArr, function(d) { return d.start });
    maxDate = d3.max(this.erasArr, function(d) { return d.stop });
  }
  console.log("min/max: " + minDate + "/" + maxDate);
  this.timeScale = d3.scale.linear()
                           .domain([minDate, maxDate])
                           .rangeRound([this.svgSideMargin,
                                  this.svgWidth - this.svgSideMargin])
                           .nice();
  // timeAxis is a function which returns the SVG elements for the axis;
  var timeAxis = d3.svg.axis()
                       .scale(this.timeScale)
                       .tickFormat(d3.format("d"))
                       .orient("bottom");
  this.D3svg.append("g")
      .attr("class", "timeAxisGrp")
      // default position is at top of SVG; move to bottom;
      .attr("transform",
            "translate(0, " + (this.eraTopMargin + this.eraHeight +
                             this.timeAxisTopMargin) + ")")
      // see relevant CSS styling for path, line, and text;
      .call(timeAxis);
};

/* =============  drawEras method ====================== */
d3.tl.Timeline.prototype.drawEras = function(targetEraLabel) {
  // if targetEraLabel is specified, others are 50% opacity;
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
      // mouseover shows the two dates and the precipEventsPanel;
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
  // htlPanel class defined in the global CSS;
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
    var topPara    = t.precipEventsObj[this.__data__.start];
    var bottomPara = t.precipEventsObj[this.__data__.stop];
    if (t.hasPrecipEventsOnHover && 
        topPara     !== undefined &&
        bottomPara  !== undefined &&
        !t.showingAll) {
      // get position and text for the precipEventsPanel; make opaque;
      var eraObj = this.__data__;
      console.log("For: " + eraObj.label + " " + eraObj.pePanelXOffset + " " + eraObj.pePanelYOffset);
      var leftX = t.timeScale(eraObj.start) - 10 + eraObj.pePanelXOffset;
      var topY  = t.eraTopMargin + (eraObj.topY * t.eraHeight) + 46 + eraObj.pePanelYOffset;
      t.D3panel
          .style("position", "absolute")
          .style("left", leftX + "px")
          .style("top", topY + "px")
          .style("opacity", 1e-6)
          .html(topPara + bottomPara)
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

/* =============  drawEraLabels method ====================== */
/*  NB: eraLabels are drawn as HTML divs (not svg text) so that they
    wrap automatically; nonetheless, if the longest word is wider than
    the era itself, an offset to the left is needed.
*/
d3.tl.Timeline.prototype.drawEraLabels = function(targetLabel) {
  var t = this;
  // create an invisible div to contain spans used to measure length of
  // longest word;
  d3.select("body")
      .append("div")
      .attr("id", "widthSpanContainer")
      .style( {"font-family": t.eraLabelsFontFamily,
               "font-size": t.eraLabelsFontSize + "px",
               "visibility": "hidden"} );
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
      .style({
        "position": "absolute",
        "z-index": "1",
        "text-align": "center",
        "pointer-events": "none",
      // if label fits, position against top-left corner of era with same
      // width; if not, position to left;
        "left": function(d) { return getLeftAndStoreWidth(d); },
        "top":  function(d) {
            return (t.eraTopMargin + (d.topY * t.eraHeight)) +
                    (d.labelTopMargin ? d.labelTopMargin : t.eraLabelsTopMargin) + "px" },
        "width": function(d) { return d.width + "px" },
        "font-family": function(d) {
                return (d.labelFontFamily ? d.labelFontFamily :
                                            this.eraLabelsFontFamily) },
        "font-size": function(d) {
                return (d.labelFontSize ? d.labelFontSize :
                                          t.eraLabelsFontSize) + "px";},
        "color": function(d) { return (d.labelColor ? d.labelColor : "black"); },
        "opacity": function(d) { if (targetLabel == undefined ||
                                         d.label === targetLabel)
                                       { return 1; } else { return 0.5; } }
       })
      .text(function(d) { return d.label });
  // grab the group itself for later delete;
  this.D3eraLabelsGrp = d3.select("#" + this.containerID + "-timeline .eraLabelsGrp");

  // finished with widthSpanContainer!
  d3.select("#widthSpanContainer").remove();
};

/* =============  drawEraDates method ====================== */
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
        .attr("font-family", "sans-serif")
        .attr("font-size", t.eraDateFontSize)
        .attr("fill", "black")
        .attr("text-rendering", "optimizeLegibility")
        .text(function(d) { return start ? d.start : d.stop });
    console.log("Dates done");
  }
  addEraDates("start");
  addEraDates("stop");

  this.D3eraDatesGrps =
             d3.selectAll("#" + t.containerID + "-timeline .eraDateGrp");
  // console.log("Num eraDate elements: " +
  //  d3.selectAll("#" + t.containerID + "-timeline .eraDate")[0].length);
};





/* =============  setup method ====================== */
d3.tl.Timeline.prototype.setup = function(container) {
  // scale by overriding default value of scale; do not call scaleTimeline();
  if (this.scale !== 1) { this.scaleTimeline(this.scale); }
  this.setContainer(container);
  if (hasHeader(this)) { this.addHeaderDiv(); }
  this.addTimelineDiv();
  if (hasFooter(this)) { this.addFooterDiv(); }
  //====== helpers ============
  function hasHeader(tl) {
    // if hasHeader = false has been added as a TL property, then non-null
    // title and/or subtitle will be overridden (should always have a title);
    if (tl.hasHeader !== undefined) { return tl.hasHeader; }
    if (tl.title !== "" ||
        tl.subtitle !== "" ||
        tl.headerText !== "") { return true; }
    return false;
  }
  function hasFooter(tl) {
    if (tl.footerHTML.length > 0) { return true; }
    return false;
  }
};

/* =============  draw method ====================== */
d3.tl.Timeline.prototype.draw = function(targetEra) {
  // draws the entire timeline assuming <container>-timeline div;
  // targetEra causes heavier outline and 50% opacity for others;
  this.drawTimeAxis();
  this.drawEras(targetEra);
  this.drawEraLabels(targetEra);
  if (this.hasEraDatesOnHover) { this.drawEraDates(); }
  // if (this.hasEvents) { this.drawEvents(); }

  // debug:
  if (false) {
    console.log("D3timeline: ", this.D3timeline);
    console.log("D3svg: ", this.D3svg);
    console.log("D3eras: ", this.D3eras);
    console.log("D3eraLabelsGrp: ", this.D3eraLabelsGrp);
    console.log("D3eraDatesGrps: ", this.D3eraDatesGrps);
  }
};

/* ========================================================================= */
/* ==================  END OF TIMELINE METHODS  ============================ */
/* ========================================================================= */