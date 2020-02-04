

var soundFile;
var fft;
var fftBands = 1024;

var description = 'loading';
var p;

var clip;
var brush;
var graphLine;
var centreLine;

var currXMax = 0;
var currYMax = 0;
var redrawAxis = false;

var x;
var y;


// This will be an array of amplitude values from lowest to highest frequencies
var frequencySpectrum = [];


// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 1280 - margin.left - margin.right,
    height = 960 - margin.top - margin.bottom;

var start = 0;
var end = fftBands;

// append the svg object to the body of the page
var svg = d3.select("#spectrum")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


function preload() {
  soundFormats('mp3', 'ogg');
  soundFile = loadSound('media/cd');
}

function setup() {
  createCanvas(fftBands, 256);

  // loop the sound file
  soundFile.loop();

  fft = new p5.FFT();

  // update description text
  p = createP(description);
  var p2 = createP('Draw the array returned by FFT.analyze( ). This represents the frequency spectrum, from lowest to highest frequencies.');

  // set the master volume;
  masterVolume(.5);

  // Add a clipPath: everything out of this area won't be drawn.
  clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

  // If user double click, reinitialize the chart
  svg.on("dblclick",function(){
    start = 0;
    end = fftBands;
    currXMax = 0;
    currYMax = 0;
    redrawAxis = true;
  });

  // Add brushing
  brush = d3.brushX()                       // Add the brush feature using the d3.brush function
      .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

  // Create the line variable: where both the line and the brush take place
  graphLine = svg.append('g')
    .attr("clip-path", "url(#clip)")
}

// gridlines in x axis function
function make_x_gridlines() {		
    return d3.axisBottom(x)
        .ticks(5)
}

// gridlines in y axis function
function make_y_gridlines() {		
    return d3.axisLeft(y)
        .ticks(5)
}

function draw() {

  // update the description if the sound is playing
  updateDescription();

  /** 
   * Analyze the sound.
   * Return array of frequency volumes, from lowest to highest frequencies.
   */
  frequencySpectrum = fft.analyze();

  var lineData = [];

  for (var i = start; i < end; i++) {

    lineData.push({"x": i, "y": frequencySpectrum[i] });
  }

  x = d3.scaleLinear()
    .domain([start, end])
    .range([ 0, width ]);

  const newYMax = d3.max(lineData, function(d) { return +d.y; });

  y = d3.scaleLinear()
    .domain([0, newYMax])
    .range([ height, 0 ]);

  if (newYMax > currYMax) { 
    currYMax = newYMax;
    redrawAxis = true;
  }

  if (redrawAxis)
  {
    redrawAxis = false;
    svg.selectAll('g').remove();

    graphLine = svg.append('g')
    .attr("clip-path", "url(#clip)");

    graphLine.append('g')
        .attr("class", "brush")
        .call(brush);

    // Add X gridlines
    xAxis = svg.append('g')
      .attr("transform", "translate(0," + height + ")")
      .call(make_x_gridlines()
        .tickSize(-height)
        .tickFormat("")
      );

    // Add Y gridlines
    yAxis = svg.append('g')
      .call(make_y_gridlines()
        .tickSize(-width)
        .tickFormat("")
      );

    // Add X axis 
    xAxis = svg.append('g')
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    yAxis = svg.append('g')
      .call(d3.axisLeft(y));

    console.log(width);
    // Add centreLine
    centreLine = svg.append('line')
    .style("stroke", "black")  // colour the line
    .attr("stroke-dasharray", "10,10")
    .attr("x1", width / 2)     // x position of the first end of the line
    .attr("y1", 0)      // y position of the first end of the line
    .attr("x2", width / 2)     // x position of the second end of the line
    .attr("y2", height); 
    
  }


      // Add the line
    svg.selectAll("path").remove();
    graphLine.append("path")
      .datum(lineData)
      .attr("class", "line")  // I add the class line to be able to modify this line later on.
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
              .x(function(d) { return x(d.x) })
              .y(function(d) { return y(d.y) })
              .defined(function(d) { return !isNaN(d.y); })
              )
}

// A function that set idleTimeOut to null
var idleTimeout
function idled() { idleTimeout = null; }

// A function that update the chart for given boundaries
function updateChart() {

  console.log("updateChart");

  // What are the selected boundaries?
  extent = d3.event.selection

  // If no selection, back to initial coordinate. Otherwise, update X axis domain
  if (!extent) {
    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
    // x.domain([ 4,8])
  } else {
    start = int(x.invert(extent[0])); //Should probably floor this value
    end = int(x.invert(extent[1])); //Should probably ceil this value
    redrawAxis = true;
    console.log("start: " + start);
    console.log("end: " + end);
    graphLine.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
  }
}

// Change description text if the song is loading, playing or paused
function updateDescription() {
  if (soundFile.isPaused()) {
    description = 'Paused...';
    p.html(description);
  }
  else if (soundFile.isPlaying()){
    description = 'Playing! Press any key to pause';
    p.html(description);
  }
  else {
    for (var i = 0; i < frameCount%3; i++ ) {
      // add periods to loading to create a fun loading bar effect
      if (frameCount%4 == 0){
        description += '.';
      }
      if (frameCount%25 == 0) {
        description = 'loading';
      }
    }
    p.html(description);
  }
}

// pause the song if a key is pressed
function keyPressed() {
  if (soundFile.isPlaying()){
    soundFile.pause();
  } else {
    soundFile.play();
  }
}
