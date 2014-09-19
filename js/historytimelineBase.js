/* this is historytimelineBase.js (eras and precipEvents only) */
/* begun September 18, 2014 */
"use strict";

d3.tl = {};

/* =============  Timeline constructor ====================== */
d3.tl.Timeline = function Timeline() {
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
  // TODO: put this inline at line 239;
  Object.defineProperty(this, "containerStyles", {
    get: function() {
      return {
        "position": "relative",
        "width": (this.svgWidth + 4) + "px",
        "font-family": this.containerFontFamily,
        "background-color": this.containerBackgroundColor
      };
    }
  });
  this.titleFontSize = 24;
  this.subtitleFontSize = 18;
  this.headerTextFontSize = 13;
  this.headerPaddingTop = 20;
  this.headerPaddingSides = 30;
  Object.defineProperty(this, "headerPaddingCSS", {
    get: function() {
      return this.headerPaddingTop + "px " + this.headerPaddingSides + "px";
    }
  });
  this.headerMarginBottom = 20;
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
  // runtime values:
  this.timeScale = null;
  this.containerID = null;
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

