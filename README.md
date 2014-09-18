# historytimeline

![Overview timeline](http://ruml.com/images/OverviewPlain48KB.jpg)

_historytimeline_ is a library which draws history timelines on a random webpage requiring only the inclusion on the page of the library itself and the data file describing the timeline (no CSS file is required).  _historytimeline_ uses timeline data in a particular format which can be generated with the companion app _htlBuilder_ but is simple enough to be hand-coded.

All of the code and documentation is available on GitHub [here](https://github.com/bruml2/historytimeline).  The project is ongoing and anyone with the interest and skill to contribute is welcome to contact the lead developer [b@ruml.com].  Design contributions are as eagerly sought as code.

### Features

Of course, the main point is to draw a beautiful timeline which clearly depicts the information provided by the timeline's creator. The timeline above displays a series of labelled **eras** commonly used in the study of the Hebrew Bible. There is a live version [here](http://ruml.com/thehebrewbible/timelines/overview.html).

One problem with many timelines is excessive busyness: too much information being displayed at once.  So a major challenge is to hide the second-level information until the user asks for it in some simple way. Two relevant kinds of information are not shown on the timeline above: the start and end dates of each era and the description of what caused an era to begin and end.


#### Precipitating Events

![Overview timeline](http://ruml.com/images/OverviewPrecip53KB.jpg)

_historytimeline_ provides a way to display both of these when the cursor is held over that era.  In the timeline above, the cursor is over the United Kingdom era and the dates for the era appear above it.
