function createWorldMap(error, countries, continentNames) {
  // Creating container element for worldMap
  let mapWidth = 1600;
  let mapHeight = 1000;
  let worldMap = d3.select("#bubble-chart")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

  const MAPVARIABLES = {
    "AFColor": "#C5E5B3",
    "ASColor": "#F3DE8A",
    "EUColor": "#EB9486",
    "NAColor": "#7E7F9A",
    "SAColor": "#97A7B3",
    "OCColor": "#413941",
    circleSizeMin: 5,
    circleSizeMax: 150,
    circleSizeMinCO2: 5,
    circleSizeMaxCO2: 150,
    circleSizeMinCO2pc: 5,
    circleSizeMaxCO2pc: 80,
    forceStrength: 0.05,
    stretchXFactor: 1.2,
    stretchYFactor: 1.5
  }

  // Fetch worldCO2Data from OWID API (Array of objects)
  let worldCO2Data;
  let CO2s;
  let CO2PerCapitas;
  getWorldCO2Data();

  // Fetch worldCO2Data asynchronously and update circles
  async function getWorldCO2Data() {
    const promise = await fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
    if (!promise.ok) {
      throw new Error("API not available");
    }

    worldCO2Data = filterData(await promise.json());
    CO2s = worldCO2Data.map(countryObj => {
      return countryObj.data.co2 ? countryObj.data.co2 : 0
    });
    CO2PerCapitas = worldCO2Data.map(countryObj => {
      return countryObj.data.co2_per_capita ? countryObj.data.co2_per_capita : 0
    });
    addFillListeners();
    addGroupingListeners();

    // Configure fetched data to a usable format
    function filterData(CO2data) {
      let countriesCO2 = [];
      let countryCO2Names = Object.keys(CO2data);
      countryCO2Names.forEach( name => {
        if (CO2data[name].iso_code && name != "World") {
          let dataArr = CO2data[name].data;
          let countryCO2Obj = {
            Countryname: name,
            data: dataArr[(dataArr.length-1)]
          }
          countriesCO2.push(countryCO2Obj);
        }
      })
      return countriesCO2
    }

  }

  // Population data
  let populations = countries.map(countryObj => parseInt(countryObj.Population));
  let populationRange = [Math.min(...populations), Math.max(...populations)];
  let continents = d3.set(countries.map(countryObj => countryObj.ContinentCode));

  // Populate worldMap with circle elements
  let circles;
  let circleRadiusScale;
  let assignColor = function(continentCode) {
    return MAPVARIABLES[continentCode + "Color"]
  }
  createCircles();

  // Create circle elements
  function createCircles() {
    circleRadiusScale = d3.scaleSqrt()
      .domain(populationRange)
      .range([MAPVARIABLES.circleSizeMin, MAPVARIABLES.circleSizeMax]);

    circles = worldMap.selectAll("circle")
      .data(countries)
      .enter()
        .append("circle")
        .attr("r", country => circleRadiusScale(country.Population))
        .on("mouseover", data => hoveredOver(data))
        .on("mouseout", data => hoveredOver())
    colorCircles();

    function colorCircles() {
      circles.attr("fill", data => assignColor(data.ContinentCode));
    }

    function hoveredOver(data) {
      if (data) {
        let lines = makeCountryInfoLines(data);

        d3.select("#country-info")
          .selectAll("div")
          .data(lines)
            .text(line => line)
            .attr("style", `color:${assignColor(data.ContinentCode)}`)

      } else {
        let lines = ["","","",""];
        d3.select("#country-info")
          .selectAll("div")
            .data(lines)
              .text(line => line);
      }

      function makeCountryInfoLines(data) {
        var formatNumber = d3.format(",");
        let index = countries.indexOf(data);

        let dataName = `${data.CountryName}`;
        let dataPopulation = `Population: ${formatNumber(data.Population)}`;
        let dataCO2 = `CO2: ${formatNumber(CO2s[index].toFixed(2))}`;
        let dataCO2PerCapita = `CO2 per capita: ${formatNumber(CO2PerCapitas[index].toFixed(2))}`

        return [dataName, dataPopulation, dataCO2, dataCO2PerCapita];
      }
    }

  }

  // Update circle radius based on mode
  function updateCircleRadius(dataArr, selector) {
    let dataArrRange = [Math.min(...dataArr), Math.max(...dataArr)];
    let circleSizeRange = circleSizes(selector);
    circleRadiusScale = d3.scaleSqrt()
      .domain(dataArrRange)
      .range(circleSizeRange);

    function circleSizes(selector) {
      if (selector === "#population") {
        return [MAPVARIABLES.circleSizeMin, MAPVARIABLES.circleSizeMax];
      } else if (selector === "#CO2") {
        return [MAPVARIABLES.circleSizeMinCO2, MAPVARIABLES.circleSizeMaxCO2];
      } else {
        return [MAPVARIABLES.circleSizeMinCO2pc, MAPVARIABLES.circleSizeMaxCO2pc];
      }
    }

    circles
      .transition()
      .duration(2000)
      .attr("r", data => {
        let index = countries.indexOf(data);
        return circleRadiusScale(dataArr[index]);
      })

    if (!countryCenterGrouping()) {
      updateForces(forces.continent);
    }

  }

  // Create Continent Key
  createKey ();
  function createKey() {
    let keyElementWidth = 150;
    let keyElementHeight = 30;
    let onScreenYOffset = keyElementHeight*1.5;
    let offScreenYOffset = 100;
    let continentKeyScale;

    if (d3.select(".continent-key").empty()) {
      createContinentKey();
      createContinentKeyElements();
    }

    slideContinentKey("translate(0," + (mapHeight - onScreenYOffset) + ")");

    // Create Continent Key
    function createContinentKey() {
      let keyWidth = keyElementWidth * continents.values().length;
      continentKeyScale = d3.scaleBand()
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
    }

    // Create Continent Key Elements
    function createContinentKeyElements() {
      d3.selectAll("g.continent-key-element")
        .append("rect")
          .attr("width", keyElementWidth)
          .attr("height", keyElementHeight)
          .attr("x", data => continentKeyScale(data))
          .attr("fill", data => assignColor(data));

      d3.selectAll("g.continent-key-element")
        .append("text")
          .attr("text-anchor", "left")
          .attr("x", data => continentKeyScale(data))
          .text(data => continentNames[data]);

      d3.selectAll("g.continent-key-element text")
          .attr("y", function(d) {
            var textHeight = this.getBBox().height;
            var unneededTextHeight = 4;
            return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
          });
    }
  
    // Animate continent key to appear on page upon loading page
    function slideContinentKey(translation) {
      d3.select(".continent-key")
        .transition()
        .duration(500)
        .attr("transform", translation);
    }
  }

  let forces;
  let forceSimulation;
  createForces();
  createForceSimulation();
  
  function createForces() {
    forces = {
      countryCenters: createCountryCenterForces(),
      continent:      createContinentForces(),
    };

    function createCountryCenterForces() {
      let projectionStretchY = 0.20;
      let projectionMargin = MAPVARIABLES.circleSizeMax;
      let projection = d3.geoEquirectangular()
          .scale((mapWidth / 2 - projectionMargin) / Math.PI)
          .translate([mapWidth / 2, mapHeight / 2]);

      function stretchMap(arr) {
        let stretchXFactor = MAPVARIABLES.stretchXFactor;
        let stretchYFactor = MAPVARIABLES.stretchYFactor;

        let differenceX = arr[0] - mapWidth/2;
        let differenceY = arr[1] - mapHeight/2;

        let newX = mapWidth/2 + differenceX * stretchXFactor;
        let newY = mapHeight/2 + differenceY * stretchYFactor;

        return [newX, newY];
      }

      return {
        x: d3.forceX(function(d) {
            return stretchMap(projection([d.CenterLongitude, d.CenterLatitude]))[0];
          }).strength(MAPVARIABLES.forceStrength),
        y: d3.forceY(function(d) {
            return stretchMap(projection([d.CenterLongitude, d.CenterLatitude]))[1] * (1 + projectionStretchY);
          }).strength(MAPVARIABLES.forceStrength)
      };
    }
  
    function createContinentForces() {
      return {
        x: d3.forceX(continentForceX).strength(MAPVARIABLES.forceStrength),
        y: d3.forceY(continentForceY).strength(MAPVARIABLES.forceStrength)
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
      function top(dimension) { return dimension / 5; }
      function topCenter(dimension) { return dimension / 5 * 2; }
      function bottom(dimension) { return dimension / 4 * 3; }
      function rightCenter(dimension) { return dimension / 4 * 3}
    }
  
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
    return countryCenterGrouping() ?  0 : findRadius(d);
  }
  function countryCenterGrouping() {
    return isChecked("#country-centers");
  }
  function isChecked(elementID) {
    return d3.select(elementID).property("checked");
  }

  function findRadius(d) {
    if (isChecked("#population")) {
      return circleRadiusScale(d.Population);

    } else {
      let index = countries.indexOf(d);
      if (isChecked("#CO2")) {
        return circleRadiusScale(CO2s[index]);
      } else {
        return circleRadiusScale(CO2PerCapitas[index]);
      }
    }
  }

  // BELOW THIS LINE IS CALLED IN THE ASYNC FUNCTION //

  function addFillListeners() {
    d3.select("#population").on("click", function() {
      updateCircleRadius(populations, "#population")
    });
    d3.select("#CO2").on("click", function () {
      updateCircleRadius(CO2s, "#CO2")
    });
    d3.select("#CO2-per-capita").on("click", function() {
      updateCircleRadius(CO2PerCapitas, "#CO2-per-capita")
    });
  }


  function addGroupingListeners() {
    addListener("#country-centers", forces.countryCenters);
    addListener("#continents", forces.continent);

    function addListener(selector, forces) {
      d3.select(selector).on("click", function() {
        updateForces(forces);
      });
    }
  }

  function updateForces(forces) {
    forceSimulation
      .force("x", forces.x)
      .force("y", forces.y)
      .force("collide", d3.forceCollide(forceCollide))
      .alphaTarget(0.5)
      .restart();
  }
}