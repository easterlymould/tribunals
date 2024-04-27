// Using code from this: https://d3-graph-gallery.com/graph/line_several_group.html
// and this: https://www.data-to-viz.com/caveat/spaghetti.html

var containerWidth = document.getElementById('my_dataviz').getBoundingClientRect().width;

var margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = containerWidth - margin.left - margin.right,
    height = (width / 800) * 500; 


// Append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
  .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
  .attr("preserveAspectRatio", "xMinYMin meet")
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Info display setup
var infoDisplay = svg.append("g")
  .attr("transform", "translate(" + (width - 260) + ",20)");

infoDisplay.append("rect")
  .attr("width", 250)
  .attr("height", 80)
  .attr("fill", "white")
  .attr("stroke-width", 2)
  .style("opacity", 0.9);

var infoBoxFontSize = width / 40;
var infoText = infoDisplay.append("text")
  .attr("x", 10)
  .attr("y", 20)
  .style("text-anchor", "start")
  .style("font-size", infoBoxFontSize + "px");

// Prepare category data
const highlightCategories = ["Violent charges", "Sex offence charges", "Military misdemeanours", "Theft charges"];
const categoryTexts = {
    "Violent charges": "Violent charges saw a considerable growth, featuring in 35% of all court martial cases in 2010 to 62% in 2023",
    "Sex offence charges": "Sex offences saw the biggest change, going from one in 20 cases in 2010 to one in three in 2023",
    "Military misdemeanours": "Military misdemeanour charges have been trending downwards since 2010",
    "Theft charges": "Theft charges remained similarly common between 2010 and 2023"
};

// Read the data and create the graph
(async function loadAndProcessData() {
    try {
        const data = await d3.csv("yearly_charges_percentages_long_format_cleaned.csv");

        // Convert 'year' and 'value' to numbers
        data.forEach(d => {
            d.year = +d.year;
            d.value = +d.value;
        });

        var sumstat = d3.group(data, d => d.category);

        // Axis setup
        var x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));

        var y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        var yAxisFontSize = width / 40;

            svg.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y", 2)
                .attr("dy", "-3em")
                .attr("transform", "rotate(-90)")
                .style("font-size", yAxisFontSize + "px")
                .text("Proportion of court martial cases featuring this charge (%)");

        var color = d3.scaleOrdinal()
            .domain(data.map(d => d.category))
            .range(d3.schemeCategory10);

        let currentCategoryIndex = -1;

        function highlightNextCategory() {
          currentCategoryIndex = (currentCategoryIndex + 1) % highlightCategories.length;
          updateVisualization();
      }

      function highlightLastCategory() {
        currentCategoryIndex = (currentCategoryIndex - 1 + highlightCategories.length) % highlightCategories.length;
        updateVisualization();
    }

    function updateVisualization() {
      const currentCategory = highlightCategories[currentCategoryIndex];
      const categoryColor = color(currentCategory); // Get the color for the current category
  
      // Update line styles and colors
      svg.selectAll(".line").remove();
      svg.selectAll(".line")
          .data(sumstat)
          .enter()
          .append("path")
              .attr("class", "line")
              .attr("fill", "none")
              .attr("stroke", d => d[0] === currentCategory ? categoryColor : "grey")
              .attr("stroke-width", d => d[0] === currentCategory ? 3 : 1)
              .attr("d", d => d3.line()
                  .x(d => x(d.year))
                  .y(d => y(d.value))
                  (d[1]));
  
      // Update text information display
      updateInfoDisplay(categoryTexts[currentCategory]);
  
      // Change the rectangle's fill color to match the line color
      infoDisplay.select("rect").attr("stroke", categoryColor);
  }


        function updateInfoDisplay(text) {
          infoText.selectAll("*").remove(); // Clear previous text
      
          const rectHeight = 80; // Height of the rectangle
          const x = 10; // x-coordinate where text starts
          const maxWidth = 230; // Maximum width of text allowed before wrapping
      
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
                  line.pop(); // Remove the word that causes the overflow
                  tspan.text(line.join(" ")); // Set the text without the overflowing word
                  line = [word]; // Start a new line with the overflowed word
                  tspan = infoText.append("tspan") // Create new tspan for the new line
                      .attr("x", x)
                      .attr("dy", "1.2em")
                      .text(word);
              }
          });
      
          // Add link for where i found bbox guide
          var bbox = infoText.node().getBBox();
          var textHeight = bbox.height;
          var startY = (rectHeight - textHeight) / 2 + bbox.y; // Calculate the center position
      
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
