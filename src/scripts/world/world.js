const ApiUtil = require("../api/api_util");
const Country = require("./country");

class World {
    constructor() {
        this.apiData = ApiUtil.worldCO2Data();
        this.countries = this.createCountries(this.apiData);
    }

    // Returns an array of country objects.
    createCountries(apiData) {
        let countries = [];
        let countryNames = Object.keys(this.apiData);

        // Create country object only if object contains the key "iso_code".
        countryNames.forEach( name => {
            if (this.apiData[name].iso_code !== undefined) {
                let country = new Country(name, this.apiData[name]);
                countries.push(country);
            }
        })
        return countries;
    }
}

export default World;
