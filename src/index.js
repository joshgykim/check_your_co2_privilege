

document.addEventListener("DOMContentLoaded", () => {
    let co2Obj = new Object();

    const promiseData = fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
    promiseData.then(response => response.json())
               .then(result => {
                    co2Obj = result;
                    console.log(Object.keys(co2Obj).length);
                    console.log(co2Obj);

                    let countriesKeys = Object.keys(co2Obj);
                    
                    let countries = {};
                    for (let i = 0; i < countriesKeys.length; i++){
                        // console.log("looping");
                        let countryName = countriesKeys[i];

                        if (co2Obj[countryName].iso_code !== undefined) {
                            countries[countryName] = co2Obj[countryName];
                        }
                    }

                    console.log(countries);
                })
    
})