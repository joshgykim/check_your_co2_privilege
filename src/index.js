
import Country from "./scripts/world/country";

document.addEventListener("DOMContentLoaded", () => {

    const promiseData = fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
    promiseData.then(response => response.json())
               .then(result => {
                    const apiData = result;

                    let countries = [];
                    let countryNames = Object.keys(apiData);
                    console.log(countryNames.length);

                    countryNames.forEach( name => {
                        if (apiData[name].iso_code && name !== "World") {
                            let dataArr = apiData[name].data;
                            let country = new Country(name, dataArr[dataArr.length-1]);
                            countries.push(country);
                        }
                    })

                    console.log(countries);
                })
    
})