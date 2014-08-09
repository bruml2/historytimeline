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
  // overides timeline-wide values;  (TO DO)
  this.labelFontSize   = null;
  this.labelFontFamily = null;
  this.labelTopMargin  = null;
  this.dateFontSize    = null;
};

/* =============  Timeline constructor ====================== */
d3.tl.Timeline = function (kind) {
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
  this.svgHeight = this.eraTopMargin + this.eraHeight + this.timeAxisHeight;  // 380
  this.svgWidth = 1200;
  if (kind === "eraUI") { this.svgWidth = 500;};
  this.svgSideMargin = 25;
  this.borderColor = "#A41034"; // Harvard Crimson;
  this.backgroundColor = "bisque";
  this.containerFontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  this.containerBackgroundColor = "white";
  this.titleFontSize = 24;
  this.subtitleFontSize = 18;
  this.headerPaddingTop = 20;
  this.headerPaddingSides = 30;
  this.headerPadding = this.headerPaddingTop + "px " +
                       this.headerPaddingSides + "px";
  this.headerMarginBottom = 20;
  this.footerFontSize = 12;
  this.footerPaddingTop = 10;
  this.footerPaddingSides = 15;
  this.footerPadding = this.footerPaddingTop + "px " +
                       this.footerPaddingSides + "px";
  this.footerMarginTop = 20;
  // runtime values:
  this.dataOrigin = null;
  this.axisStartYr = null;  // used when not null;
  this.axisStopYr  = null;
  this.timeScale = null;
  this.containerID = null;
  this.footerTextBuffer = null;
  // htlQuizzer runtime values:
  this.remainingLabels = null;
  this.origErasArr = null;
  this.quizTargetEra = null;
  
  this.erasArr = [ new d3.tl.Era() ];
  this.eraLabelsFontSize = 16;
  this.eraLabelsFontFamily = "Palatino, Times, \"Times New Roman\", Georgia, serif";
  this.eraLabelTopMargin = 10;
  this.eraDateFontSize = 16;

  this.containerStyles = function () {
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
  this.D3erasGrp  = null;
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
  console.log("Loaded . . .");
};

/* =============  Timeline setup methods ====================== */
d3.tl.Timeline.prototype.scaleTimeline = function (scaleBy) {
  // the default width is 1200px; scaleBy arg (0.1 to n);
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
    "eraLabelTopMargin",
    "eraLabelsFontSize",
    "eraDateFontSize"
  ];
  scaleable.forEach(function (prop) {
    // console.log("for ", prop, t[prop], t[prop] * scaleBy);
    t[prop] = t[prop] * scaleBy;
  });

  this.svgHeight = this.eraTopMargin + this.eraHeight + this.timeAxisHeight;
  this.headerPadding = this.headerPaddingTop + "px " +
                       this.headerPaddingSides + "px";
  this.footerPadding = this.footerPaddingTop + "px " +
                       this.footerPaddingSides + "px";
};

d3.tl.Timeline.prototype.styleContainer = function (container) {
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

d3.tl.Timeline.prototype.addHeaderDiv = function () {
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

d3.tl.Timeline.prototype.addTimelineDiv = function () {
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
  // If the timeline is scaled, it needs a separate css style for time axis
  // font size;
  if (this.scale !== 1) {
    d3.select("body").append("style")
      .attr("class", "customTimeAxisStyle")
      .text("#" + t.containerID + "-timeline .timeAxisGrp text {" +
            "  font-family: sans-serif;" +
            "  font-size: " + t.timeAxisFontSize + "px;" +
            "  text-rendering: optimizeLegibility; /* SVG attribute */}");
  };
};

d3.tl.Timeline.prototype.addFooterDiv = function () {
  var t = this;
  d3.select("#" + t.containerID)
      .style(this.containerStyles)
    .append("div")
      .attr("id", t.containerID + "-footer")
      .style({"padding": t.footerPadding,
              "margin-top": t.footerMarginTop + "px",
              "border": "2px solid " + this.borderColor,
              "font-size": t.footerFontSize + "px"}
      
      )
      .html(this.footerHTML);
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawTimeAxis = function () {
  // set up timescale for x-axis;
  // if axisStartYr and axisStopYr are not null, then use those values instead of computing from eras (e.g., empty timeline or during building;
  var minDate, maxDate;
  if (this.axisStartYr !== null && this.axisStopYr !== null) {
    minDate = this.axisStartYr;
    maxDate = this.axisStopYr;
  } else {
    minDate = d3.min(this.erasArr, function(d){ return d.start });
    maxDate = d3.max(this.erasArr, function(d){ return d.stop });
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
d3.tl.Timeline.prototype.drawEras = function (targetEraLabel) {
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
        // console.log("this: ", this);
        // console.log("mouseover: ", this.__data__.label);
        if (t.hasEraDatesOnHover && !t.showingAll) {
          // on mouseover of era, select the two start/stop dates whose class
          // is the era's id (the dates are text els) and make them visible;
          var selectorStr = "#" + t.containerID + "-timeline .eraDateGrp ." + d3.select(this).attr("id");
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
        if (!t.showingDates && !t.showingAll && t.hasEraDatesOnHover) {
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
    this.D3eras.each(function(d, i) {
      if (this.__data__.label === targetEraLabel) {
        d3.select(this).style("stroke-width", 2);
      } else {
        d3.select(this).style("opacity",0.5);
      }
    });
  };
  this.D3timeline.append("div")
    .attr("class", "precipEventsPanel");
  this.D3precipEventsPanel =
            d3.select("#" + this.containerID + "-timeline .precipEventsPanel");            
  // grab the <g> element for later delete;
  this.D3erasGrp = d3.select("#" + this.containerID + "-timeline .erasGrp");
};

/* ======================================================================= */
d3.tl.Timeline.prototype.drawEraLabels = function (targetLabel) {
  var t = this;
  // create an invisible div to contain spans used to measure length of
  // longest word;
  d3.select("body")
      .append("div")
      .attr("id", "widthSpanContainer")
      .style("font-family", t.eraLabelsFontFamily)
      .style("font-size", t.eraLabelsFontSize + "px")
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
    // create a span to measure width of widest word;
    var widthSpan = document.createElement('span');
    widthSpan.setAttribute('style', 'font-family: ' + t.eraLabelsFontFamily +
            '; font-size: ' + t.eraLabelsFontSize + 'px');
    widthSpan.innerHTML = longestWord;
    var cont = document.getElementById('widthSpanContainer'); 
    cont.appendChild(widthSpan); 
    // console.log("lastChile.offsetWidth: " + cont.lastChild.offsetWidth); 
    // console.log("lastChile.clientWidth: " + cont.lastChild.clientWidth);
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
      .attr("id", function(d){
        return t.containerID + "-" + d.label.replace(/\W/g, "") + "Label" })
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
  // grab the group itself for later delete;
  this.D3eraLabelsGrp = d3.select("#" + this.containerID + "-timeline .eraLabelsGrp");

  // finished with widthSpanContainer!
  d3.select("#widthSpanContainer").remove();
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
  
  this.D3eraDatesGrps =
             d3.selectAll("#" + t.containerID + "-timeline .eraDateGrp");
  // console.log("Num eraDate elements: " +
  //  d3.selectAll("#" + t.containerID + "-timeline .eraDate")[0].length);   
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
  if (this.scale !== 1) { this.scaleTimeline(this.scale); }
  // adds to DOM inside container;
  this.styleContainer(container)
  if (this.hasHeader) { this.addHeaderDiv(); };
  this.addTimelineDiv();
  if (this.hasFooter) { this.addFooterDiv(); };
};

/* ======================================================================= */
d3.tl.Timeline.prototype.draw = function (targetEra) {
  // draws the entire timeline assuming <container>-timeline div;
  this.drawTimeAxis();
  this.drawEras(targetEra);
  this.drawEraLabels(targetEra);
  this.drawEraDates();
  if (this.hasEvents) { this.drawEvents(); };
  
  // debug:
  if (this.showD3selectionsInConsole === true) {
    console.log("D3timeline: ", this.D3timeline);
    console.log("D3svg: ", this.D3svg);
    console.log("D3erasGrp: ", this.D3erasGrp);
    console.log("D3eras: ", this.D3eras);
    console.log("D3eraLabelsGrp: ", this.D3eraLabelsGrp);
    console.log("D3eraDatesGrps: ", this.D3eraDatesGrps);
    }
};

/* ======================================================================= */
d3.tl.Timeline.prototype.initQuiz = function (difficulty) {
  // creates array of labels; stores orig value of erasArr;
  this.hasEraDatesOnHover = false;
  this.hasPrecipEventsOnHover = false;
  this.hasFooterTextOnHover = false;
  this.remainingLabels = [];
  this.origErasArr = [];
  // second arg sets value of this within callback (else undefined!);
  this.erasArr.forEach(function (era) {
    this.remainingLabels.push(era.label);
    this.origErasArr.push(era);
  }, this);
};

/* ======================================================================= */
d3.tl.Timeline.prototype.nextQuizItem = function () {
  // get next left-to-right label; clone erasArr;
  var targetLabel = this.remainingLabels.shift();
  /* this is a hard way to hide label; easier is to hide with CSS!
  this.erasArr = this.origErasArr.map(function (era) {
    if (era.label === targetLabel) {
      this.quizTargetEra = {}; 
      for (prop in era) {
        if (era.hasOwnProperty(prop)) {
          this.quizTargetEra[prop] = era[prop];
        }
      }
      era.label = "";
    }
    return era;
  }, this);
  console.log("cloneArr: ", cloneArr);
  console.log("targetEra: ", this.quizTargetEra);
  */
  // hide targetLabel with CSS:
  var targetLabelEl = d3.select("#" + this.containerID + "-" +
         targetLabel.replace(/\W/g, "") + "Label");
  // targetLabelEl.classed("hidden", true);
  // targetLabelEl.text("foo");
  targetLabelEl.style("color", "transparent");
  targetLabelEl.append("input")
    .attr("type", "text");
  
};

/* ======================================================================= */
// this function is not currently used (or tested);
d3.tl.Timeline.prototype.removeTimelineContents = function () {
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

/* ========== END OF CODE ================================================ */
