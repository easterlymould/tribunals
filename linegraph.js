// Using code from this: https://d3-graph-gallery.com/graph/line_several_group.html
// and this: https://www.data-to-viz.com/caveat/spaghetti.html


var softColours = [
    "#B22222", "#002d9c", "#7c1158","#5d914c"

];

function getVisualizationDimensions(containerId) {
    var container = document.getElementById(containerId);
    var containerWidth = container.getBoundingClientRect().width;
    var margin = { top: 10, right: 30, bottom: 30, left: 60 };
    var width = containerWidth - margin.left - margin.right;
    var height = (width / 800) * 500;  // Maintain the aspect ratio

    return { width, height, margin };
}

var baseFontSize = 16

var axisFontSize = baseFontSize * 0.85

var yLabelFontSize = baseFontSize * 0.95

var tickValues = d3.range(2010, 2024, 2);

// Append the svg object to the body of the page
var dims = getVisualizationDimensions('my_dataviz1');
        var svg = d3.select("#my_dataviz1")
            .append("svg")
            .attr("viewBox", `0 0 ${dims.width + dims.margin.left + dims.margin.right} ${dims.height + dims.margin.top + dims.margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .append("g")
            .attr("transform", `translate(${dims.margin.left}, ${dims.margin.top})`);

// Info display setup
var infoDisplay = svg.append("g")
  .attr("transform", "translate(" + (dims.width - 270) + ",30)");

infoDisplay.append("rect")
  .attr("width", 245)
  .attr("height", 100)
  .attr("fill", "white")
  .attr("rx", 4)
  .attr("stroke-width", 2.5)
  .style("opacity", 0.9);
  


var infoText = infoDisplay.append("text")
  .attr("x", 20)
  .attr("y", 60)
  .style("text-anchor", "start")
  .style("font-size", baseFontSize + "px");

// Prepare category data
const highlightCategories = ["Violent charges", "Sex offence charges", "Military misdemeanours", "Theft charges"];
const categoryTexts = {
    "Violent charges": "Violent charges saw a considerable growth, featuring in 35% of all court martial cases in 2010 and 62% in 2023",
    "Sex offence charges": "Sex offences saw the biggest change, growing from one in 20 cases in 2010 to one in three in 2023",
    "Military misdemeanours": "Military misdemeanour charges have been trending downwards since 2010",
    "Theft charges": "Theft charges remained similarly common between 2010 and 2023"
};

// Read the data and create the graph
(async function loadAndProcessData() {
    try {
        const data = await d3.csv("yearly_charges_percentages_long_format_cleaned.csv");

        data.forEach(d => {
            d.year = +d.year;
            d.value = +d.value;
        });

        var sumstat = d3.group(data, d => d.category);

        // Axis setup
        var x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([0, dims.width]);
            svg.append("g")
            .attr("transform", "translate(0," + dims.height + ")")
            .call(d3.axisBottom(x)
                  .tickValues(tickValues)
                  .tickFormat(d3.format("d")))
            .selectAll("text")
            .style("font-size", axisFontSize);

        var y = d3.scaleLinear()
            .domain([0, 100])
            .range([dims.height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text") 
            .style("font-size", axisFontSize + "px");

            svg.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y", 0)
                .attr("x", 0)
                .attr("dy", "-2.5em")
                .attr("transform", "rotate(-90)")
                .style("font-size", yLabelFontSize + "px")
                .text("Proportion of court martial cases featuring this charge (%)");

            var colour = d3.scaleOrdinal()
                .domain(highlightCategories)
                .range(softColours);

        let currentCategoryIndex = -1;

        function highlightNextCategory() {
          currentCategoryIndex = (currentCategoryIndex + 1) % highlightCategories.length;
          updateVisualisation();
      }

      function highlightLastCategory() {
        currentCategoryIndex = (currentCategoryIndex - 1 + highlightCategories.length) % highlightCategories.length;
        updateVisualisation();
    }

    function updateVisualisation() {
      const currentCategory = highlightCategories[currentCategoryIndex];
      const categoryColour = colour(currentCategory);

      // Update line styles and colours
      svg.selectAll(".line").remove();
      svg.selectAll(".line")
          .data(sumstat)
          .enter()
          .append("path")
              .attr("class", "line")
              .attr("fill", "none")
              .attr("stroke", d => d[0] === currentCategory ? categoryColour : "grey")
              .attr("stroke-width", d => d[0] === currentCategory ? 3 : 1)
              .attr("d", d => d3.line()
                  .x(d => x(d.year))
                  .y(d => y(d.value))
                  (d[1]));
  
      // Update text information display
      updateInfoDisplay(categoryTexts[currentCategory]);
  
      // Change the rectangle's fill colour to match the line colour
      infoDisplay.select("rect").attr("stroke", categoryColour);
  }


        function updateInfoDisplay(text) {
          infoText.selectAll("*").remove();
      
          const rectHeight = 110; 
          const x = 10; 
          const maxWidth = 230;
      
          // Start the first line of text
          var tspan = infoText.append("tspan")
              .attr("x", x)
              .attr("y", 10)
              .attr("text-anchor", "start");
      
          var words = text.split(/\s+/);
          var line = [];
      
          words.forEach(function(word) {
              line.push(word);
              tspan.text(line.join(" "));
              if (tspan.node().getComputedTextLength() > maxWidth) {
                  line.pop();
                  tspan.text(line.join(" ")); 
                  line = [word]; 
                  tspan = infoText.append("tspan")
                      .attr("x", x)
                      .attr("dy", "1.2em")
                      .text(word);
              }
          });
      
          // Add link for where i found bbox guide
          var bbox = infoText.node().getBBox();
          var textHeight = bbox.height;
          var startY = (rectHeight - textHeight) / 2 + bbox.y;

          // Adjust the text group position to center it vertically
          infoText.attr("transform", "translate(0," + (startY - bbox.y) + ")");
      }

        // Setup button event listener
        document.getElementById("backButton").addEventListener("click", highlightLastCategory);
        document.getElementById("nextButton").addEventListener("click", highlightNextCategory);

        // Initially load the first category details
        highlightNextCategory();

    } catch (error) {
        console.error('Error with CSV:', error);
    }
})();

function setupBasicLineGraph() {
    console.log("Setting up the basic line graph...");
        var dims = getVisualizationDimensions('my_dataviz2');
        var svg = d3.select("#my_dataviz2")
            .append("svg")
            .attr("viewBox", `0 0 ${dims.width + dims.margin.left + dims.margin.right} ${dims.height + dims.margin.top + dims.margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .append("g")
            .attr("transform", `translate(${dims.margin.left}, ${dims.margin.top})`);    


    // Scales and axes setup with the same domains and styles
    var x = d3.scaleLinear()
            .domain([2010, 2023])
            .range([0, dims.width]);
    var y = d3.scaleLinear()
            .domain([0, 100])
            .range([dims.height, 0]);

                svg.append("text")
                .attr("class", "y label2")
                .attr("text-anchor", "end")
                .attr("y", 4)
                .attr("x", 0)
                .attr("dy", "-3em")
                .attr("transform", "rotate(-90)")
                .style("font-size", yLabelFontSize + "px")
                .text("Conviction rate on violent and sex offence charges (%)");


    d3.csv("long_format_conviction_rates.csv").then(function(data) {
        console.log("Data loaded successfully:", data);

        data.forEach(function(d) {
            d.year = +d.year;
            d.value = +d.value;
        });

        var sumstat = d3.group(data, d => d.category);

        svg.append("g")
   .attr("transform", "translate(0," + dims.height + ")")
   .call(d3.axisBottom(x)
         .tickValues(tickValues)
         .tickFormat(d3.format("d")))
   .selectAll("text")
   .style("font-size", axisFontSize);

    // Set up the Y Axis with larger font size
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", axisFontSize);

        var colour = d3.scaleOrdinal()
                .domain(highlightCategories)
                .range(softColours);

        sumstat.forEach(function(values, key) {
            svg.append("path")
                .datum(values)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colour(key))
                .attr("stroke-width", 3)
                .attr("d", d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.value))
                );
        });
    }).catch(function(error) {
        console.error('Error loading the CSV:', error);
    });
}

setupBasicLineGraph();
