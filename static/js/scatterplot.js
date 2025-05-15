function createScatterplot(data) {
    const width = 400;
    const height = 400;
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    
    // Create SVG
    const svg = d3.select("#svg_plot")
        .attr("width", width)
        .attr("height", height);
    
    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(Object.values(data.pca_data), d => d.x))
        .range([margin.left, width - margin.right]);
    
    const y = d3.scaleLinear()
        .domain(d3.extent(Object.values(data.pca_data), d => d.y))
        .range([height - margin.bottom, margin.top]);
    
    // Add points
    svg.selectAll("circle")
        .data(Object.entries(data.pca_data))
        .enter()
        .append("circle")
        .attr("cx", d => x(d[1].x))
        .attr("cy", d => y(d[1].y))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .attr("data-country", d => d[0])
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleClick);
    
    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));
    
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
        
    // Add title
    svg.append("text")
        .attr("x", width/2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .text("PCA Visualization");
}

function handleMouseOver(event, d) {
    const countryName = d3.select(this).attr("data-country"); // get country name from attribute;
    console.log("Hovering over:", countryName);

    const countryData = globalData.current_data[countryName];
        if (!countryData) {
            console.warn(`No data found for country: ${countryName}`);
            return;
        }
    // Highlight the scatter plot point
    d3.select("#svg_plot")
        .selectAll("circle")
        .filter(d => d[0] === countryName)
        .attr("r", 8)
        .attr("fill", "orange");

    // Show tooltip with country data
    const tooltip = d3.select(".tooltip");    
    let tooltipContent = `
        <div class="tooltip-title">${countryName}</div>
        <div class="tooltip-content">
            <div><strong>Access to electricity:</strong> ${countryData.access_to_electricity__of_population?.toFixed(1) || 'N/A'}%</div>
            <div><strong>Agricultural irrigated land:</strong> ${countryData.agricultural_irrigated_land__of_total_agricultural_land?.toFixed(1) || 'N/A'}%</div>
            <div><strong>Average precipitation:</strong> ${countryData.average_precipitation_in_depth_mm_per_year || 'N/A'} mm/year</div>
            <div><strong>Employment in agriculture:</strong> ${countryData.employment_in_agriculture__of_total_employment_modeled_ilo_estimate?.toFixed(1) || 'N/A'}%</div>
            <div><strong>GDP per capita:</strong> $${countryData.gdp_per_capita_current_us?.toFixed(1) || 'N/A'}</div>
            <div><strong>Land area:</strong> ${countryData.land_area_sq_km?.toLocaleString() || 'N/A'} km²</div>
            <div><strong>Population:</strong> ${countryData.population_total?.toLocaleString() || 'N/A'}</div>
        </div>
    `;
    
    tooltip.html(tooltipContent)
        .style("right", "20px")  // Position from right instead of left
        .style("top", "20px")    // Position from top
        .style("left", "auto")   // Remove left positioning
        .style("opacity", 1);
    
        
    // Highlight corresponding map region if it exists
    const mapPath = d3.select("#svg_map")
        .selectAll("path")
        .filter(path => path?.properties?.admin === countryName);
        
    if (!mapPath.empty()) {
        mapPath.style("fill", "orange")
            .style("stroke-width", "2")
            .style("stroke", "#000");
    }
}

function handleMouseOut(event, d) {
    const countryName = d3.select(this).attr("data-country");

    // Reset scatter plot point
    d3.select("#svg_plot")
        .selectAll("circle")
        .filter(d => d[0] === countryName)
        .attr("r", 5)
        .attr("fill", "steelblue");
        
    // Hide tooltip
    d3.select(".tooltip")
        .style("opacity", 0);
        
    // Reset map region if it exists
    const mapPath = d3.select("#svg_map")
        .selectAll("path")
        .filter(path => path?.properties?.admin === countryName);
        
    if (!mapPath.empty()) {
        mapPath.style("fill", null)
            .style("stroke-width", "0.5")
            .style("stroke", "#000");
    }
}

function handleClick(event, d) {
    const countryName = d?.properties?.admin || d[0]; 
    console.log("Clicked country:", countryName);
    
    // Here you can add code for updating the line chart
    if (globalData?.current_data?.[countryName]) {
        // TODO: Implement line chart update
        console.log("Country data:", globalData.current_data[countryName]);
    }

    if (countryName && currentIndicator) {
        updateLineChart(countryName, currentIndicator);
    }
}