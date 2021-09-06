function createCircle() {
    let circleSize = {min: 10, max: 80};
    let circleRadiusScale = d3.scaleSqrt()
    .domain(populationRange)
    .range([circleSize.min, circleSize.max]);

    
}

export default createCircle;