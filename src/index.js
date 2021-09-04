

document.addEventListener("DOMContentLoaded", () => {
    let co2Obj = new Object();

    const promiseData = fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json");
     promiseData.then(response => response.json())
               .then(result => {
                   co2Obj = result;
                //    console.log(co2Obj);

                   const afg = co2Obj.Afghanistan;
                   console.log(afg.data[afg.data.length-1].co2)
                })
    
})