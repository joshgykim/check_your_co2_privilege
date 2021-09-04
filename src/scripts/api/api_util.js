const ApiUtil = {
    worldCO2Data: function() {
        let worldCO2Data = new Object();

        const APIPromise = fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
        APIPromise.then(response => response.json())
                  .then(result => worldCO2Data = result);

        return worldCO2Data;
    }
}

export default ApiUtil;