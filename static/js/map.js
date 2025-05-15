let mapWidth = 800;
let mapHeight = 500;
let map = null;
let mapData = null;
let colorScale = null;

function showTooltip(countryName) {
    const countryData = globalData.current_data[countryName];
    if (!countryData) return;

    const tooltip = d3.select(".tooltip");    
    const tooltipContent = `
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
        .style("right", "20px")
        .style("top", "20px")
        .style("left", "auto")
        .style("opacity", 1);
}

function hideTooltip() {
    d3.select(".tooltip").style("opacity", 0);
}

function handleMapMouseOver(event, d) {
    const countryName = d?.properties?.admin || 'unknown';
    if (countryName === 'unknown') return;

    // Only highlight if country has data
    if (globalData?.current_data?.[countryName]) {
        // Highlight map
        d3.select(this)
            .style("stroke-width", "2")
            .style("stroke", "#000")
            .style("fill", "orange");

        // Highlight scatterplot point
        d3.select("#svg_plot")
            .selectAll("circle")
            .filter(d => d[0] === countryName)
            .attr("r", 8)
            .attr("fill", "orange");

        // Show tooltip
        showTooltip(countryName);
    }
}

function handleMapMouseOut(event, d) {
    const countryName = d?.properties?.admin || 'unknown';
    if (countryName === 'unknown') return;

    // Reset map
    d3.select(this)
        .style("stroke-width", "0.5")
        .style("stroke", "#000")
        .style("fill", globalData?.current_data?.[countryName] ? "#ccc" : "#fff");

    // Reset scatterplot point
    d3.select("#svg_plot")
        .selectAll("circle")
        .filter(d => d[0] === countryName)
        .attr("r", 5)
        .attr("fill", "steelblue");

    // Hide tooltip
    hideTooltip();
}

function handleClick(event, d) {
    const countryName = d?.properties?.admin || d[0];
    console.log("Current indicator:", currentIndicator);
    console.log("Clicked country name:", countryName);
    if (countryName && currentIndicator) {
        updateLineChart(countryName, currentIndicator);
    }
}

function initMap(data) {
    // loads the world map as topojson
    d3.json("../static/data/world-topo.json").then(function(countries) {
        // Setup color scale
        colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 100]); // Default domain, will update in updateMapColors

        // defines the map projection method and scales the map within the SVG
        let projection = d3.geoEqualEarth()
            .scale(180)
            .translate([mapWidth / 2, mapHeight / 2]);

        // generates the path coordinates from topojson
        let path = d3.geoPath()
            .projection(projection);

        // configures the SVG element
        let svg = d3.select("#svg_map")
            .attr("width", mapWidth)
            .attr("height", mapHeight);

        // map geometry
        map = svg.append("g")
            .selectAll("path")
            .data(topojson.feature(countries, countries.objects.countries).features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "country")
            .attr("id", d => {
                const countryName = d?.properties?.admin || 'unknown';
                return `country-${countryName.replace(/\s+/g, '-')}`;
            })
            .attr("fill", d => {
                const countryName = d?.properties?.admin || 'unknown';
                return globalData?.current_data?.[countryName] ? "#ccc" : "#fff";
            })
            .attr("stroke", "#000") 
            .attr("stroke-width", "0.5")
            .each(function(d) {
                const countryName = d?.properties?.admin || 'unknown';
                d3.select(this).attr("data-country", countryName);
            })
            .on("mouseover", handleMapMouseOver)
            .on("mouseout", handleMapMouseOut)
            .on("click", handleClick);
    });
}

function createLegend(svg) {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = mapWidth - legendWidth - 20;
    const legendY = mapHeight - 50;

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    const stops = d3.range(0, 1.1, 0.1);
    stops.forEach(stop => {
        gradient.append("stop")
            .attr("offset", `${stop * 100}%`)
            .attr("stop-color", colorScale(stop * 100));
    });

    svg.append("rect")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
        .range([0, legendWidth])
        .domain(colorScale.domain());

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5);

    svg.append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(${legendX},${legendY + legendHeight})`)
        .call(legendAxis);
}

function updateLegend() {
    const legendScale = d3.scaleLinear()
        .range([0, 200])
        .domain(colorScale.domain());

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5);

    d3.select(".legend-axis")
        .transition()
        .duration(750)
        .call(legendAxis);
}