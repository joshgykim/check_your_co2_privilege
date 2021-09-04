const ApiUtil = require("../api/api_util");
const Country = require("./country");

class World {
    constructor() {
        this.apiData = ApiUtil.worldCO2Data();
        this.countries = this.createCountries();
    }

    // Returns an array of country objects.
    createCountries() {
        let countries = [];
        let countryNames = Object.keys(this.apiData);

        // Create country object only if object contains the key "iso_code".
        countryNames.forEach( name => {
            if (this.apiData[name].iso_code && name !== "World") {
                let dataArr = this.apiData[name].data;

                // Only fetch the most recent yearly data
                let country = new Country(name, dataArr[dataArr.length-1]);
                countries.push(country);
            }
        })
        return countries;
    }
}

export default World;
