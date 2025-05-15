function drawLinePlot(data, indicator) {
    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    d3.select("#svg_line_plot").selectAll("*").remove();

    const svg = d3.select("#svg_line_plot")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Filter and process data
    let processedData;
    if (selectedCountry) {
        // Show single country data
        processedData = data
            .filter(d => d.country_name === selectedCountry)
            .map(d => ({
                year: d.year,
                value: d[indicator]
            }))
            .filter(d => !isNaN(d.value))
            .sort((a, b) => a.year - b.year);
    } else {
        // Show average data
        const yearData = {};
        data.forEach(d => {
            const year = d.year;
            const value = d[indicator];
            if (!yearData[year]) yearData[year] = [];
            if (!isNaN(value)) yearData[year].push(value);
        });

        processedData = Object.entries(yearData)
            .map(([year, values]) => ({
                year: parseInt(year),
                value: d3.mean(values)
            }))
            .sort((a, b) => a.year - b.year);
    }

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(processedData, d => d.year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.value)])
        .range([height - margin.bottom, margin.top]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Add title
    const title = selectedCountry ? 
        `${indicator} for ${selectedCountry}` : 
        `Average ${indicator} Across All Countries`;
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(title);

    // Create and add line
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    svg.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add points
    svg.selectAll("circle")
        .data(processedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", "steelblue");
}

function initLinePlot(data) {
    const indicator = document.getElementById("indicator_change").value;
    drawLinePlot(data, indicator);
}