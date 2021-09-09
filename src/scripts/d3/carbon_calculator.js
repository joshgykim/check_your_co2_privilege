function createCarbonCalculator(error, calculatorJSON) {
  const GRAPHVARIABLES = {
    travelColor: "#EB9084",
    homeColor: "#F1DA7E",
    foodColor: "#767793",
    goodsColor: "#C5E5B3",
    servicesColor: "#95A5B2",
  }

  // let CO2PerCapitas;
  // getCO2PerCapitasData();

  // async function getCO2PerCapitasData() {
  //   const promise = await fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
  //   if (!promise.ok) {
  //     throw new Error("API not available");
  //   }

  //   let CO2Data = filterData(await promise.json());
  //   CO2PerCapitas = CO2Data.map(countryObj => {
  //     return countryObj.data.co2_per_capita ? countryObj.data.co2_per_capita : 0
  //   });

  //   function filterData(CO2data) {
  //     let countriesCO2 = [];
  //     let countryCO2Names = Object.keys(CO2data);
  //     countryCO2Names.forEach( name => {
  //       if (CO2data[name].iso_code && name != "World") {
  //         let dataArr = CO2data[name].data;
  //         let countryCO2Obj = {
  //           Countryname: name,
  //           data: dataArr[(dataArr.length-1)]
  //         }
  //         countriesCO2.push(countryCO2Obj);
  //       }
  //     })
  //     return countriesCO2
  //   }
  // }

  let sizeLabels = ["avg(2.5)", "1", "2", "3", "4", "5+"];
  let incomeLabels = ["avg", "<20k", "<40k", "<60k", "<80k", "<100k", "100k+"]
  let xAxisLabel = ["TRAVEL", "HOME", "FOOD", "GOODS", "SERVICES"];
  let calculatedData = calculatorJSON["2.5"]["average"];  

  function makeSliderLabels(selector) {
    let labelArr = selector === "#household-size-labels" ? sizeLabels : incomeLabels;
    let labels = d3.selectAll(selector)
    labels
      .selectAll("div")
      .data(labelArr)
      .enter()
        .append("div")
        .attr("class", "slider-tick-container")

    d3.selectAll(`${selector} .slider-tick-container`)
      .append("div")
      .attr("class", "slider-tick-mark")
      .text("|")

    d3.selectAll(`${selector} .slider-tick-container`)
      .append("div")
      .attr("class", "slider-tick-mark")
      .text(function (data, i) {
        return labelArr[i];
      })

  }

  makeSliderLabels("#household-size-labels");
  makeSliderLabels("#household-income-labels");
  showUserCO2("0", "0");

  function showUserCO2(size, income) {
    const reducer = (acc, val) => acc + val;
    let householdData = calculatorJSON[translateHousehold(size)][translateIncome(income)];
    let householdEmission =  (Object.values(householdData).reduce(reducer)).toFixed(2);
    let userEmission = (householdEmission / parseInt(translateHousehold(size))).toFixed(2);

    d3.select("#household-CO2 > .CO2-text").html(`  ${householdEmission} `)
    d3.select("#user-CO2 > .CO2-text")
      .attr("id", `e${userEmission}`)
      .html(`  ${userEmission} `)
  }
  

  let canvasWidth = 1600;
  let canvasHeight = 1000;
  let graphCanvas = d3.select("#user-carbon-graph")
                      .append("svg")
                      .attr("width", canvasWidth)
                      .attr("height", canvasHeight);

  let boundMargin = 100;
  let barSpacing = 220;
  let barWidth = 150;
  let canvasUpperB = boundMargin;
  let canvasLowerB = canvasHeight - boundMargin;
  let xOffset = (canvasWidth - (barSpacing * 5)) / 2 +
                (barSpacing-barWidth) / 2;
  let reducer = (acc, val) => acc + val;

  function categorizeData(data) {
    let travelArr = findCO2s("travel");
    let homeArr = findCO2s("home");
    let foodArr = findCO2s("food");
    let goodsArr = findCO2s("goods");
    let servicesArr = findCO2s("services");

    function findCO2s(category) {
      let categoryArr = [0];
      let searchKeys = Object.keys(data).filter(key => key.includes(category));
      searchKeys.forEach(key => {
        categoryArr.push(data[key]);
      })

      return categoryArr;
    }

    return [travelArr, homeArr, foodArr, goodsArr, servicesArr];
  }

  createBars();
  updateBars();
  

  function createBars() {
    // Y-AXIS
    graphCanvas
      .append("line")
      .attr("id", "y-axis")
      .attr("x1", `${xOffset - 40}`)
      .attr("y1", `${canvasLowerB}`)
      .attr("x2", `${xOffset - 40}`)
      .attr("y2", `${canvasUpperB}`)
      .attr("stroke", "#7E8287")
      .attr("stroke-width", "1.5px")

    // X-RULER LINES
    for (let b = 0; b < 6; b++) {
      graphCanvas
        .append("line")
        .attr("class", "ruler")
        .attr("id", `r${b}`)
        .attr("x1", `${xOffset - 40}`)
        .attr("y1", `${canvasLowerB}`)
        .attr("x2", `${barSpacing * 6 + 45}`)
        .attr("y2", `${canvasLowerB} `)
        .attr("stroke", "#a2a6aa")
        .attr("stroke-width", "2px")
        .attr("stroke-dasharray", "15,10")
      
      if (b !== 0) {
        graphCanvas
          .append("text")
          .attr("class", "ruler-marker")
          .attr("id", `rm${b}`)
          .attr("x", `${xOffset - 60}`)
          .attr("y", `${canvasLowerB - 10}`)
          .attr("text-anchor", "end")
          .text(`${b*5} t`)
      }
    }

    // BARS
    let barsData = categorizeData(calculatedData);
    for (let j = 0; j < barsData.length; j++) {
      
      graphCanvas
        .append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", j * barSpacing + barWidth / 2 + xOffset)
        .attr("y", canvasLowerB + 40)
        .text(xAxisLabel[j])

      for (let i = 0; i < barsData[j].length-1; i++) {
        graphCanvas
          .append("rect")
          .attr("id", `rect${j}rect${i}`)
          .attr("x", j * barSpacing + xOffset)
          .attr("y", canvasLowerB)
          .attr("width", barWidth)
          .attr("height", 0)
          .attr("fill", assignColor(j))
      }
    }

    // X-AXIS
    graphCanvas
      .append("line")
      .attr("x1", `${xOffset - 40 - 40}`)
      .attr("y1", `${canvasLowerB}`)
      .attr("x2", `${barSpacing * 6 + 45 + 40}`)
      .attr("y2", `${canvasLowerB}`)
      .attr("stroke", "#7E8287")
      .attr("stroke-width", "5px")
  }

  function assignColor(j) {
    if (j === 0) return GRAPHVARIABLES.travelColor;
    if (j === 1) return GRAPHVARIABLES.homeColor;
    if (j === 2) return GRAPHVARIABLES.foodColor;
    if (j === 3) return GRAPHVARIABLES.goodsColor;
    if (j === 4) return GRAPHVARIABLES.servicesColor;
  }
  
  function updateBars() {
    let barsData = categorizeData(calculatedData);
    let maxCO2 = Math.max(...barsData.map( category => category.reduce(reducer) ));
    let barScale = d3.scaleLinear()
        .domain([0, maxCO2])
        .range([canvasUpperB, canvasLowerB]);

    //UPDATE RULERS
    for (let b = 0; b < 6; b++) {
      let CO2Level = b * 5;
      let difference = maxCO2 - CO2Level;

      d3.select(`#r${b}`)
        .transition()
        .duration(2000)
        .attr("y1", `${barScale(difference)}`)
        .attr("y2", `${barScale(difference)}`)

      if (b !== 0) {
        d3.select(`#rm${b}`)
          .transition()
          .duration(2000)
          .attr("y", `${barScale(difference) + 7}`)
      }
    }
    
    // UPDATE BARS
    for (let j = 0; j < barsData.length; j++) {
      d3.selectAll(".bar-description").remove();
      let categoryData = barsData[j];
      let difference = maxCO2 - categoryData.reduce(reducer);
      let categoryDataPos = accum(categoryData, difference);

      function accum (testArr, difference) {
        let returnArr = [difference]
        for (let i = 1; i < testArr.length; i++) {
          returnArr.push(testArr[i] + returnArr[returnArr.length-1])
        }
        return returnArr
      }

      for (let i = 0; i < categoryDataPos.length-1; i++) {
        let id = `rect${j}rect${i}`
        let x = j * barSpacing + xOffset;
        let y = barScale(categoryDataPos[i]);
        let height =  barScale(categoryData[i+1])-boundMargin;
        let midpoint = [x + barWidth/2, y + height/2]
        d3.selectAll(`#${id}`)
          .transition()
          .duration(2000)
          .attr("x", x)
          .attr("y", y)
          .attr("width", barWidth)
          .attr("height", height)
        
        if (height > 40) {
          setTimeout(() => {
            graphCanvas
              .append("text")
              .attr("class", "bar-description")
              .attr("text-anchor", "middle")
              .attr("x", midpoint[0])
              .attr("y", midpoint[1]+7)
              .attr("fill", "white")
              .attr("font-weight", "bold")
              .text(translateType([j, i]).toUpperCase())
          }, 1700)
        }
      
        d3.selectAll(`#${id}`)
          .on("mouseover", data => hoveredOver(categoryData[i+1], midpoint, [j, i]))
          .on("mouseout", data => hoveredOver())
      }
    }
  }

  function hoveredOver(emission, midpoint, type) {
    if (emission) {
      graphCanvas
        .append("rect")
        .attr("class", "bubble")
        .attr("x", midpoint[0]+50)
        .attr("y", midpoint[1]-30)
        .attr("ry", 10)
        .attr("rx", 10)
        .attr("width", barWidth)
        .attr("height", 60)
      
      graphCanvas
        .append("text")
        .attr("class", "bubble-text")
        .attr("text-anchor", "middle")
        .attr("x", midpoint[0] + barWidth/2 + 50)
        .attr("y", midpoint[1] + 17)
        .text(emission + " t")
      
      graphCanvas
        .append("text")
        .attr("class", "bubble-text")
        .attr("text-anchor", "middle")
        .attr("x", midpoint[0] + barWidth/2 + 50)
        .attr("y", midpoint[1] - 7)
        .attr("fill", `${assignColor(type[0])}`)
        .attr("font-weight", "bold")
        .text(translateType(type).toUpperCase())

      graphCanvas
        .append("polyline")
        .attr("class", "bubble")
        .attr("points", `${midpoint[0]+51.5},${midpoint[1]+10} ${midpoint[0]+40},${midpoint[1]} ${midpoint[0]+51.5},${midpoint[1]-10}`)
    } else {
      d3.selectAll(".bubble").remove();
      d3.selectAll(".bubble-text").remove()
    }
  }

  function translateType(arr) {
    let key = `${arr[0]},${arr[1]}`;

    const translation = {
      "0,0": "Car Fule",
      "0,1": "Car MFG",
      "0,2": "Car Air",
      "1,0": "Electricity",
      "1,1": "Natural Gas",
      "1,2": "Other",
      "1,3": "Water",
      "1,4": "Construction",
      "2,0": "Meat",
      "2,1": "Dairy",
      "2,2": "Fruits & Veg",
      "2,3": "Cereals",
      "2,4": "Other",
      "3,0": "Clothing",
      "3,1": "Furniture",
      "3,2": "Other",
      "4,0": "All Services"
    }

    return translation[key];
  }




  function translateHousehold(input) {
    if (input === "0") return "2.5"
    if (input === "1") return "1"
    if (input === "2") return "2"
    if (input === "3") return "3"
    if (input === "4") return "4"
    if (input === "5") return "5"
  }

  function translateIncome(input) {
    if (input === "0") return "average"
    if (input === "1") return "<20k"
    if (input === "2") return "<40k"
    if (input === "3") return "<60k"
    if (input === "4") return "<80k"
    if (input === "5") return "<100k"
    if (input === "6") return "100k+"
  }

  function calculateTotalCO2(zip, householdInput, incomeInput) {

    let householdKey = translateHousehold(householdInput);
    let incomeKey = translateIncome(incomeInput);
    let breakdown = calculatorJSON[householdKey][incomeKey];

    return breakdown;
  }

  // click "calculate"
  d3.select("button#calculate")
    .on("click.foo", function() {
      d3.event.preventDefault();
      let zipcodeInput = d3.select("#zipcode-input");
      let zipcode = zipcodeInput.property("value");

      let householdInput = d3.select("#household-size-input");
      let householdSize = householdInput.property("value");

      let incomeInput = d3.select("#household-income-input");
      let income = incomeInput.property("value");

      calculatedData = calculateTotalCO2(zipcode, householdSize, income);
      updateBars();
      showUserCO2(householdSize, income);
    });
  
}