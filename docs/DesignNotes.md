#Design Notes for historytimeline.js (HTL)

HTL assumes that the webpage into which a timeline is to be embedded:
  1) contains an empty <div id=""> inside which the timeline will be drawn; and
  2) loads both d3 and the HTL code in that order.

<div id="<containerName>"></div>

<script src="js/d3.min.js"></script>
<script src="js/historytimeline.js"></script>

The HTL code creates a tl property on the d3 object which namespaces the code:
  d3.tl = {};

The constructors are:
  d3.tl.Timeline() [constructor]
  d3.tl.Era() [constructor]
  
The public instance methods of a Timeline object are:
  loadTimeline(timelineObj) - overwrites default data with actual data;
  setup(containerID) - creates three <divs> inside the container: header, timeline, and footer;
  draw([targetEra]) - adds an svg element to the timeline div and additional elements as required including a <g class="timeAxisGrp"> child to the svg for the time axis;
  
==== USAGE:

A typical pattern (demonstrated in examples/historytimeline.html) is to load a json description of a timeline into a suitably-named property of the d3.tl namespace:
  <script src="tl/overviewTL.js"></script>

which contains:

    d3.tl.overviewTL = {
      "dataOrigin": "overviewTL.js",
      "title": "The Hebrew Bible",
      . . .
    };
  
Then, in a script tag on the HTML page, instantiate a default timeline, load the desired timeline into it, setup, and draw:
<script>
    d3.tl.theTimeline = new d3.tl.Timeline();
    d3.tl.theTimeline.loadTimeline(d3.tl.overviewTL);
    /* changes to the overviewTL timeline may be inserted here */
    d3.tl.theTimeline.setup("overviewBContainer");
    d3.tl.theTimeline.draw();
</script>
  
A loaded timeline may be modified in any respect by loading the custom property values on top of the loaded ones:

    d3.tl.harvardStyle = {
      "borderColor": "#A41034",
      "footerHTML": "<span class=\"drawnBy\">Designed by . . ..</span>"
    };
    d3.tl.theTimeline.loadTimeline(d3.tl.harvardStyle);
  
  
==== PROPERTIES OF THE TIMELINE OBJECT:

  see the constructor function which should include all properties;

==== DOM STRUCTURE OF A TIMELINE AS DRAWN

<div id="containerID">
  <div id="containerID-header"></div>
  <div id="containerID-timeline">
    <svg>
      <g class="timeAxisGrp"></g>
      <g class="erasGrp"></g>
      <g class="eraStartDateGrp"></g>
      <g class="eraStopDateGrp"></g>
    </svg>
    <g class="eraLabelsGrp">
    <div id="precipEventsPanel">
  </div>
  <div id="containerID-footer"></div>
</div>

==== DATES USED TO CREATE TIME AXIS:

For a completed timeline, the endpoints of the time axis are taken from the earliest and latest eras.  [Should also take into account other objects such as events and people.]

When a timeline is being built, it starts out with an empty erasArr; as a result, the endpoints are taken from this.axisStartYr and this.axisStopYr which are specified by the user in the startPanel (defaults: -1500 and 2014).

During the building process, we want to retain the use of the originally specified endpoints so if this.axisStartYr and this.axisStopYr are not null, they continue to be used.  When the last era has been added, they are set to null and the values are stored in this.builderMinMax as properties.  If the user wants to return to using the original values (checkbox?), then they are restored to this.axisStartYr and this.axisStopYr.

==== TO DO
get doneBtn to work on eraPanel2;
color the eras as they are added;




