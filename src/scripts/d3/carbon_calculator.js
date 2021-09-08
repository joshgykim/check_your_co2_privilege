function createCarbonCalculator(error, calculatorJSON) {
  const GRAPHVARIABLES = {
    travelColor: "#EB9084",
    homeColor: "#F1DA7E",
    foodColor: "#767793",
    goodsColor: "#C5E5B3",
    servicesColor: "#95A5B2",
  }

  let sizeLabels = ["avg(2.5)", "1", "2", "3", "4", "5+"];
  let incomeLabels = ["avg", "<20k", "<40k", "<60k", "<80k", "<100k", "100k+"]
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

  let canvasWidth = 1600;
  let canvasHeight = 1000;
  let graphCanvas = d3.select("#user-carbon-graph")
                      .append("svg")
                      .attr("width", canvasWidth)
                      .attr("height", canvasHeight);

  let boundMargin = 100;
  let barSpacing = 220;
  let barWidth = 180;
  let canvasUpperB = boundMargin;
  let canvasLowerB = canvasHeight - boundMargin;
  let xOffset = (canvasWidth - (barSpacing * 5)) / 2 +
                (barSpacing-barWidth) / 2;

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
    let barsData = categorizeData(calculatedData);
    for (let j = 0; j < barsData.length; j++) {
      let categoryData = barsData[j];
      let maxCO2 = 30;
      let reducer = (acc, val) => acc + val;
      let difference = maxCO2 - categoryData.reduce(reducer);
      let categoryDataPos = accum(categoryData, difference);
      let barScale = d3.scaleLinear()
        .domain([0, maxCO2])
        .range([canvasUpperB, canvasLowerB]);

      function accum (testArr, difference) {
        let returnArr = [difference]
        for (let i = 1; i < testArr.length; i++) {
          returnArr.push(testArr[i] + returnArr[returnArr.length-1])
        }
        return returnArr
      }

      for (let i = 0; i < categoryDataPos.length-1; i++) {
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
    for (let j = 0; j < barsData.length; j++) {
      let categoryData = barsData[j];
      let maxCO2 = 30;
      let reducer = (acc, val) => acc + val;
      let difference = maxCO2 - categoryData.reduce(reducer);
      let categoryDataPos = accum(categoryData, difference);
      let barScale = d3.scaleLinear()
        .domain([0, maxCO2])
        .range([canvasUpperB, canvasLowerB]);

      function accum (testArr, difference) {
        let returnArr = [difference]
        for (let i = 1; i < testArr.length; i++) {
          returnArr.push(testArr[i] + returnArr[returnArr.length-1])
        }
        return returnArr
      }

      for (let i = 0; i < categoryDataPos.length-1; i++) {
        let id = `rect${j}rect${i}`
        d3.selectAll(`#${id}`)
          .transition()
          .duration(2000)
          .attr("x", j * barSpacing + xOffset)
          .attr("y", barScale(categoryDataPos[i]))
          .attr("width", barWidth)
          .attr("height", barScale(categoryData[i+1])-boundMargin)
      }
    }
  }






  function calculateTotalCO2(zip, householdInput, incomeInput) {

    let householdKey = translateHousehold(householdInput);
    let incomeKey = translateIncome(incomeInput);
    let breakdown = calculatorJSON[householdKey][incomeKey];

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

    return breakdown;
  }

  // click "calculate"
  d3.select("button#calculate")
    .on("click", function() {
      d3.event.preventDefault();
      let zipcodeInput = d3.select("#zipcode-input");
      let zipcode = zipcodeInput.property("value");

      let householdInput = d3.select("#household-size-input");
      let householdSize = householdInput.property("value");

      let incomeInput = d3.select("#household-income-input");
      let income = incomeInput.property("value");

      calculatedData = calculateTotalCO2(zipcode, householdSize, income);
      updateBars();
    });

  // const reducer = (acc, val) => acc + val;
  // let CO2Emission = Object.values(breakdown).reduce(reducer)/parseInt(householdKey);
  
}