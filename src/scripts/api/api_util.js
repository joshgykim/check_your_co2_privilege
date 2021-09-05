const ApiUtil = {
    worldCO2Data: function() {
        const APIPromise = fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
        // console.log(APIPromise);
        if (!APIPromise.ok) {
            throw new Error("API currently not available.");
        }

        const worldCO2Data = APIPromise.json();
        return worldCO2Data;
    }
}

export default ApiUtil;