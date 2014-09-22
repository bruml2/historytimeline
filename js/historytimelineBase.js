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
  this.hasFooterTextOnHover = false;
  // runtime values:
  this.containerID = null;
  this.timeScale   = null;    // needed for later scaling (eras);
  this.oldFooterHTML = null;
  // runtime states (displayControlPanel);
  this.showingDates = false;
  this.showingAll   = false;
  // D3 selections:
  this.D3timeline = null;  // 2nd div inside the container;
  this.D3svg      = null;
  this.D3eras     = null;
  this.D3eraLabelsGrp = null;
  this.D3eraDatesGrps = null;
  // debug:
  this.showD3selectionsInConsole = false;
};

/* =============  Era constructor ====================== */
d3.tl.Era = function Era(label, start, stop, bgcolor) {
  this.label = label || "Example Label";
  this.start = start || -380;
  this.stop  = stop  || -220;
  this.bgcolor = bgcolor || "#F5BCA9";
  this.topY    = 0;
  this.height  = 1.0;
  // overides timeline-wide values;  (TO DO)
  this.pePanelXOffset = null;  // offset from default;
  this.pePanelYOffset = null;
  this.labelFontSize   = null;
  this.labelFontFamily = null;
  this.labelTopMargin  = null;
};

/* =============  loadTimeline method ====================== */
d3.tl.Timeline.prototype.loadTimeline = function(tlObj) {
  // NB: any erasArr already on the timeline will be overwritten; therefore,
  // if one wishes to modify the eras provided in a standard timeline
  // (already loaded), the overriding tl object must provide ALL the eras
  // wanted (none will be preserved from the standard timeline);

  // first, if the tl being loaded has an erasArr, each era is written over an
  // instantiated era containing all possible era properties;
  if (tlObj.erasArr) {
    var newErasArr = tlObj.erasArr.map(function(thisEra, idx, oldEraArr) {
      var newEra = new d3.tl.Era();
      Object.keys(thisEra).forEach(function(key) {
        if (thisEra.hasOwnProperty(key)) { newEra[key] = thisEra[key]; }     
      });
      return newEra;
    });
    tlObj.erasArr = newErasArr;
  }
  // each property in tlObj is assigned to that property in "this" overriding
  // the defaults assigned in the constructor; Note need for 2nd arg to set
  // value of "this" in function.
  Object.keys(tlObj).forEach(function(key) {
    if (tlObj.hasOwnProperty(key)) { this[key] = tlObj[key]; }
  }, this);

  // check for features;
  if (this.precipEventsObj) { this.hasPrecipEventsOnHover = true; }
  if (this.footerTextObj)   { this.hasFooterTextOnHover = true; }
  if (this.eventsArr)       { this.hasEvents = true; }
  
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
  this.D3svg = d3.select("#" + t.containerID + "-timeline svg");
  /*
  this.D3timeline = d3.select("#" + t.containerID + "-timeline");
  */
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







/* =============  setup method ====================== */
d3.tl.Timeline.prototype.setup = function(container) {
  if (this.scale !== 1) { this.scaleTimeline(this.scale); }
  this.setContainer(container);
  if (addHeader(this)) { this.addHeaderDiv(); }
  this.addTimelineDiv();
  if (hasFooter(this)) { this.addFooterDiv(); }
  
  function addHeader(tl) {
    // if hasHeader = false has been added as a TL property, then non-null
    // title and/or subtitle will be overridden (should always have a title);
    if (tl.hasHeader == true) { return true; }
    if (tl.title !== "" ||
        tl.subtitle !== "" ||
        tl.headerText !== "") {
      return true;
    }
    return false;
  }
  function hasFooter(tl) {
    if (tl.footerHTML.length > 0) {
      return true;
    }
    return false;
  }
};




