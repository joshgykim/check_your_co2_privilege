function createCarbonCalculator(error, calculatorJSON) {
  //Create
  let userInput = d3.select("#user-carbon-input")
  // let carbonGraph = d3.select("#user-carbon-graph")
  //   .append("svg")
  //   .attr("width", 1600)
  //   .attr("height", 400)

  let sizeLabels = ["Average", "1", "2", "3", "4", "5+"];
  let incomeLabels = ["Average", "<20k", "<40k", "<60k", "<80k", "<100k", "100k+"]
  

  function makeSliderLabels(selector) {
    let labelArr = selector === "#household-size-labels" ? sizeLabels : incomeLabels;
    console.log(labelArr);
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
      console.log([zipcode, householdSize, income]);

      console.log(calculateTotalCO2(zipcode, householdSize, income));
    });
  

    function calculateTotalCO2(zip, householdInput, incomeInput) {

      let householdKey = translateHousehold(householdInput);
      let incomeKey = translateIncome(incomeInput);

      let breakdown = calculatorJSON[householdKey][incomeKey];
      const reducer = (acc, val) => acc + val;
      let CO2Emission = Object.values(breakdown).reduce(reducer)/parseInt(householdKey);
      
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

      return CO2Emission;
    }
  
};