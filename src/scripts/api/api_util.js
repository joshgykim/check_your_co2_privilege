const ApiUtil = {
    worldCO2Data: function() {
        return fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
    }
}