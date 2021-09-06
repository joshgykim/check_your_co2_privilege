function createWorldMap(error, countries, continentNames) {
  let worldCO2Data;

  async function getData() {
    const promise = await fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
    if (!promise.ok) {
      throw new Error("API not available");
    }
    let data = await promise.json();
    worldCO2Data = filterData(data);
    console.log(worldCO2Data)
    updateCircles();
    
  }

  function filterData(CO2data) {
    let countriesCO2 = [];
    let countryCO2Names = Object.keys(CO2data);

    countryCO2Names.forEach( name => {
      if (CO2data[name].iso_code && name != "World") {
        let dataArr = CO2data[name].data;

        let countryCO2Obj = {
          Countryname: name,
          data: dataArr[dataArr.length-1]
        }
        countriesCO2.push(countryCO2Obj);
      }
    })
    return countriesCO2
  }

  getData();

  // Population data
  let populations = countries.map(countryObj => parseInt(countryObj.Population));
  let populationRange = [Math.min(...populations), Math.max(...populations)];
  

  let continents = d3.set(countries.map(countryObj => countryObj.ContinentCode));

  function continentColorScale(continentCode) {
    if (continentCode === "AF") {
      return "#2274A5";
    } else if (continentCode === "AS") {
      return "#F1C40F";
    } else if (continentCode === "EU") {
      return "#F75C03";
    } else if (continentCode === "NA") {
      return "#D90368";
    } else if (continentCode === "OC") {
      return "#6B2737";
    } else {
      return "#00CC66";
    }
  }
  

  // Creating canvas(svg) element for worldMap
  let mapWidth = 1500;
  let mapHeight = 1000;
  let worldMap = d3.select("#bubble-chart")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);


  // Populating worldMap with circle elements
  let circleSize = {min: 10, max: 120};

  let circleRadiusScale = d3.scaleSqrt()
    .domain(populationRange)
    .range([circleSize.min, circleSize.max]);

  let circles = worldMap.selectAll("circle")
    .data(countries)
    .enter()
      .append("circle")
      .attr("r", country => circleRadiusScale(country.Population))
      .on("mouseover", function(d) {
        hoveredOver(d);
      })
      .on("mouseout", function(d) {
        hoveredOver();
      });
  
  colorCircles();

  function colorCircles() {
    circles
      .attr("fill", function(d) {
        return continentColorScale(d.ContinentCode);
      });
  }

  function updateCircles() {
    let CO2s = worldCO2Data.map(countryObj => {
      if (countryObj.data.co2 !== undefined) {
        return countryObj.data.co2;
      } else {
        return 0;
      }
    });
    let CO2Range = [Math.min(...CO2s), Math.max(...CO2s)];
    let circleRadiusScaleCO2 = d3.scaleSqrt()
      .domain(CO2Range)
      .range([5, 200]);

    circles
      .attr("r", function(d) {
        let index = countries.indexOf(d);
        return circleRadiusScaleCO2(CO2s[index]);
      })
  }

  function hoveredOver(country) {
    var formatPopulation = d3.format(",");
    var info = "";
      if (country) {
        info = [country.CountryName, formatPopulation(country.Population)].join(": ");
      }
      d3.select("#country-info").html(info);
  }

  let forces;
  let forceSimulation;
  
  makeContinentLegend();
    createForces();
    createForceSimulation();
    addFillListener();
    addGroupingListeners();
  
    // function createSVG() {
    //   svg = d3.select("#bubble-chart")
    //     .append("svg")
    //       .attr("width", mapWidth)
    //       .attr("height", mapHeight);
    // }
  
  function makeContinentLegend() {
    let keyElementWidth = 150;
    let keyElementHeight = 30;
    let onScreenYOffset = keyElementHeight*1.5;
    let offScreenYOffset = 100;

    if (d3.select(".continent-key").empty()) {
      createContinentKey();
    }

    function createContinentKey() {
      var keyWidth = keyElementWidth * continents.values().length;
      var continentKeyScale = d3.scaleBand()
        .domain(continents.values())
        .range([(mapWidth - keyWidth) / 2, (mapWidth + keyWidth) / 2]);

      worldMap.append("g")
        .attr("class", "continent-key")
        .attr("transform", "translate(0," + (mapHeight + offScreenYOffset) + ")")
        .selectAll("g")
        .data(continents.values())
        .enter()
          .append("g")
            .attr("class", "continent-key-element");

      d3.selectAll("g.continent-key-element")
        .append("rect")
          .attr("width", keyElementWidth)
          .attr("height", keyElementHeight)
          .attr("x", function(d) { return continentKeyScale(d); })
          .attr("fill", function(d) { return continentColorScale(d); });

      d3.selectAll("g.continent-key-element")
        .append("text")
          .attr("text-anchor", "middle")
          .attr("x", function(d) { return continentKeyScale(d) + keyElementWidth/2; })
          .text(function(d) { return continentNames[d]; });

      // The text BBox has non-zero values only after rendering
      d3.selectAll("g.continent-key-element text")
          .attr("y", function(d) {
            var textHeight = this.getBBox().height;
            // The BBox.height property includes some extra height we need to remove
            var unneededTextHeight = 4;
            return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
          });
    }
  
    function translateContinentKey(translation) {
      d3.select(".continent-key")
        .transition()
        .duration(500)
        .attr("transform", translation);
    }

    translateContinentKey("translate(0," + (mapHeight - onScreenYOffset) + ")");
  }
  
    function isChecked(elementID) {
      return d3.select(elementID).property("checked");
    }
  

  
    function createForces() {
      var forceStrength = 0.05;
  
      forces = {
        countryCenters: createCountryCenterForces(),
        continent:      createContinentForces(),
      };
  
      // function createCombineForces() {
      //   return {
      //     x: d3.forceX(width / 2).strength(forceStrength),
      //     y: d3.forceY(height / 2).strength(forceStrength)
      //   };
      // }
  
      function createCountryCenterForces() {
        var projectionStretchY = 0.25,
            projectionMargin = circleSize.max,
            projection = d3.geoEquirectangular()
              .scale((mapWidth / 2 - projectionMargin) / Math.PI)
              .translate([mapWidth / 2, mapHeight * (1 - projectionStretchY) / 2]);
  
        return {
          x: d3.forceX(function(d) {
              return projection([d.CenterLongitude, d.CenterLatitude])[0];
            }).strength(forceStrength),
          y: d3.forceY(function(d) {
              return projection([d.CenterLongitude, d.CenterLatitude])[1] * (1 + projectionStretchY);
            }).strength(forceStrength)
        };
      }
  
      function createContinentForces() {
        return {
          x: d3.forceX(continentForceX).strength(forceStrength),
          y: d3.forceY(continentForceY).strength(forceStrength)
        };
  
        function continentForceX(d) {
          if (d.ContinentCode === "EU") {
            return center(mapWidth);
          } else if (d.ContinentCode === "AF") {
            return center(mapWidth);
          } else if (d.ContinentCode === "AS") {
            return rightCenter(mapWidth);
          } else if (d.ContinentCode === "NA") {
            return left(mapWidth);
          } else if (d.ContinentCode === "SA") {
            return left(mapWidth);
          }
          return rightCenter(mapWidth);
        }
  
        function continentForceY(d) {
          if (d.ContinentCode === "EU") {
            return top(mapHeight);
          } else if (d.ContinentCode === "AF") {
            return bottom(mapHeight)-100;
          } else if (d.ContinentCode === "AS") {
            return topCenter(mapHeight);
          } else if (d.ContinentCode === "NA") {
            return topCenter(mapHeight);
          } else if (d.ContinentCode === "SA") {
            return bottom(mapHeight);
          }
          return bottom(mapHeight);
        }
  
        function left(dimension) { return dimension / 4; }
        function center(dimension) { return dimension / 2 }
        function right(dimension) { return dimension / 7 * 5; }
        function top(dimension) { return dimension / 5; }
        function topCenter(dimension) { return dimension / 5 * 2; }
        function bottom(dimension) { return dimension / 4 * 3; }
        function rightCenter(dimension) { return dimension / 4 * 3}
      }
  
      // function createPopulationForces() {
      //   var continentNamesDomain = continents.values().map(function(continentCode) {
      //     return continentNames[continentCode];
      //   });
      //   var scaledPopulationMargin = circleSize.max;
  
      //   populationScaleX = d3.scaleBand()
      //     .domain(continentNamesDomain)
      //     .range([scaledPopulationMargin, width - scaledPopulationMargin*2]);
      //   populationScaleY = d3.scaleLog()
      //     .domain(populationRange)
      //     .range([height - scaledPopulationMargin, scaledPopulationMargin*2]);
  
      //   var centerCirclesInScaleBandOffset = populationScaleX.bandwidth() / 2;
      //   return {
      //     x: d3.forceX(function(d) {
      //         return populationScaleX(continentNames[d.ContinentCode]) + centerCirclesInScaleBandOffset;
      //       }).strength(forceStrength),
      //     y: d3.forceY(function(d) {
      //       return populationScaleY(d.Population);
      //     }).strength(forceStrength)
      //   };
      // }
  
    }
  
    function createForceSimulation() {
      forceSimulation = d3.forceSimulation()
        .force("x", forces.countryCenters.x)
        .force("y", forces.countryCenters.y)
        .force("collide", d3.forceCollide(forceCollide));
      forceSimulation.nodes(countries)
        .on("tick", function() {
          circles
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        });
    }
  
    function forceCollide(d) {
      return countryCenterGrouping() ? 0 : circleRadiusScale(d.Population) * 1.25;
    }

    function updateForceSimulation() {
      forceSimulation = d3.forceSimulation()
        .force("x", forces.countryCenters.x)
        .force("y", forces.countryCenters.y)
        .force("collide", d3.forceCollide(updateForceCollide));
      
      function updateForceCollide(d) {
        return countryCenterGrouping() ? 0 : circleRadiusScaleCO2(d.Population) * 1.25;
      }

      forceSimulation.nodes(countries)
        .on("tick", function() {
          circles
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        });
    }
  
    function countryCenterGrouping() {
      return isChecked("#country-centers");
    }
  
    // function populationGrouping() {
    //   return isChecked("#population");
    // }
  
    // function addFlagDefinitions() {
    //   var defs = svg.append("defs");
    //   defs.selectAll(".flag")
    //     .data(countries)
    //     .enter()
    //       .append("pattern")
    //       .attr("id", function(d) { return d.CountryCode; })
    //       .attr("class", "flag")
    //       .attr("width", "100%")
    //       .attr("height", "100%")
    //       .attr("patternContentUnits", "objectBoundingBox")
    //         .append("image")
    //         .attr("width", 1)
    //         .attr("height", 1)
    //         // xMidYMid: center the image in the circle
    //         // slice: scale the image to fill the circle
    //         .attr("preserveAspectRatio", "xMidYMid slice")
    //         .attr("xlink:href", function(d) {
    //           return "flags/" + d.CountryCode + ".svg";
    //         });
    // }
  
    function addFillListener() {
      d3.selectAll('input[name="fill"]')
        .on("change", function() {
          toggleContinentKey();
          updateCircles();
        });
    }
  
    function addGroupingListeners() {
      addListener("#country-centers", forces.countryCenters);
      addListener("#continents",      forces.continent);
  
      function addListener(selector, forces) {
        d3.select(selector).on("click", function() {
          updateForces(forces);
        });
      }
  
      function updateForces(forces) {
        forceSimulation
          .force("x", forces.x)
          .force("y", forces.y)
          .force("collide", d3.forceCollide(forceCollide))
          .alphaTarget(0.5)
          .restart();
      }
  
      // function togglePopulationAxes(showAxes) {
      //   var onScreenXOffset = 40,
      //       offScreenXOffset = -40;
      //   var onScreenYOffset = 40,
      //       offScreenYOffset = 100;
  
      //   if (d3.select(".x-axis").empty()) {
      //     createAxes();
      //   }
      //   var xAxis = d3.select(".x-axis"),
      //       yAxis = d3.select(".y-axis");
  
      //   if (showAxes) {
      //     translateAxis(xAxis, "translate(0," + (height - onScreenYOffset) + ")");
      //     translateAxis(yAxis, "translate(" + onScreenXOffset + ",0)");
      //   } else {
      //     translateAxis(xAxis, "translate(0," + (height + offScreenYOffset) + ")");
      //     translateAxis(yAxis, "translate(" + offScreenXOffset + ",0)");
      //   }
  
      //   function createAxes() {
      //     var numberOfTicks = 10,
      //         tickFormat = ".0s";
  
      //     var xAxis = d3.axisBottom(populationScaleX)
      //       .ticks(numberOfTicks, tickFormat);
  
      //     svg.append("g")
      //       .attr("class", "x-axis")
      //       .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
      //       .call(xAxis)
      //       .selectAll(".tick text")
      //         .attr("font-size", "16px");
  
      //     var yAxis = d3.axisLeft(populationScaleY)
      //       .ticks(numberOfTicks, tickFormat);
      //     svg.append("g")
      //       .attr("class", "y-axis")
      //       .attr("transform", "translate(" + offScreenXOffset + ",0)")
      //       .call(yAxis);
      //   }
  
      //   function translateAxis(axis, translation) {
      //     axis
      //       .transition()
      //       .duration(500)
      //       .attr("transform", translation);
      //   }
      // }
    }
}