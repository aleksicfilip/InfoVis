let lineChartWidth = 800;
let lineChartHeight = 400;
let lineChartMargin = { top: 40, right: 30, bottom: 50, left: 60 };
let selectedCountry = null;

function createLineChart() {
    // Create SVG container
    const svg = d3.select("#line-chart")
        .attr("width", lineChartWidth)
        .attr("height", lineChartHeight);

    // Add title placeholder
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", lineChartWidth / 2)
        .attr("y", lineChartMargin.top / 2)
        .attr("text-anchor", "middle")
        .text("Time Series Data");

    // Add axes groups
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${lineChartHeight - lineChartMargin.bottom})`);

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${lineChartMargin.left},0)`);

    // Add X axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", lineChartWidth / 2)
        .attr("y", lineChartHeight - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    // Add Y axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(lineChartHeight / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Value");
}

function updateLineChart(countryName, indicator) {
    if (!countryName || !indicator || !globalData?.time_series?.[countryName]) return;

    selectedCountry = countryName;
    const svg = d3.select("#line-chart");

    // Get only values, ignore years from data
    const values = Object.values(globalData.time_series[countryName])
        .map(data => parseFloat(data[indicator]))
        .filter(value => !isNaN(value));

    console.log("Values:", values);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([1960, 2020]) // Fixed x-axis domain
        .range([lineChartMargin.left, lineChartWidth - lineChartMargin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(values) * 1.1])
        .range([lineChartHeight - lineChartMargin.bottom, lineChartMargin.top]);

    // Create points data with indexed x positions
    const pointsData = values.map((value, index) => ({
        x: 1960 + index, // Map index to year
        value: value
    }));

    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    // Update axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(7)
        .tickFormat(d3.format("d"));

    const yAxis = d3.axisLeft(yScale)
        .ticks(10);

    svg.select(".x-axis")
        .transition()
        .duration(750)
        .call(xAxis);

    svg.select(".y-axis")
        .transition()
        .duration(750)
        .call(yAxis);

    svg.select(".chart-title")
        .text(`${indicator} - ${countryName}`);

    // Update y-axis label
    svg.select(".y-axis-label")
        .text(indicator);

    // Update line
    const path = svg.selectAll(".line-path")
        .data([pointsData]);

    path.enter()
        .append("path")
        .attr("class", "line-path")
        .merge(path)
        .transition()
        .duration(750)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    // Update points
    const points = svg.selectAll(".data-point")
        .data(pointsData);

    const pointsEnter = points.enter()
        .append("circle")
        .attr("class", "data-point");

    points.merge(pointsEnter)
        .transition()
        .duration(750)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.value))
        .attr("r", 4)
        .attr("fill", "steelblue");

    // Update hover effects
    pointsEnter
        .on("mouseover", function(event, d) {
            const tooltip = d3.select(".tooltip");
            tooltip.style("opacity", 1)
                .html(`Year: ${d.x}<br/>Value: ${d.value.toFixed(2)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            
            d3.select(this)
                .attr("r", 6)
                .attr("fill", "orange");
        })
        .on("mouseout", function() {
            d3.select(".tooltip").style("opacity", 0);
            d3.select(this)
                .attr("r", 4)
                .attr("fill", "steelblue");
        });

    points.exit().remove();
    path.exit().remove();
}