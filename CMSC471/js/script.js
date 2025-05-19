console.log('D3 Version:', d3.version);

// Ensure D3.js is included in your HTML file before running this script
// Set up SVG dimensions
const width = 1000;
const height = 500;
const xMax = 100, curveMargin = {x: 0.3 * width, y: 0.2 * height};
const randRange = xMax / 3;
const circleRadius = 5, numCircles = 200;
const startLowPerc = 0.2, endLowPerc = 0.3;
let animationDuration = 10, randDelayDuration = 20;
const optionToField = {
    startYear: 'year',
    endYear: 'year',
    g1Age: 'ageRange',
    g1Sex: 'sex',
    g1Ethnicity: 'ethnicity',
    g1Health: 'health',
    g1Income: 'income',
    g1Insured: 'insured',
    g1Served: 'served',
    g2Age: 'ageRange',
    g2Sex: 'sex',
    g2Ethnicity: 'ethnicity',
    g2Health: 'health',
    g2Income: 'income',
    g2Insured: 'insured',
    g2Served: 'served'
};
let groupColors = {
    1: d3.select('#g1Color').node().value,
    2: d3.select('#g2Color').node().value
};

let allData = [];

let group1before = [];
let group1after = [];
let group2before = [];
let group2after = [];

let depressionRates = {
    'g1before': 0.0,
    'g1after': 0.0,
    'g2before': 0.0,
    'g2after': 0.0,
};

let counts = {
    g1Depressed: 0,
    g1NotDepressed: 0,
    g2Depressed: 0,
    g2NotDepressed: 0
};

let totalPop = {
    'g1before': 0,
    'g1after': 0,
    'g2before': 0,
    'g2after': 0
}

// Append an SVG element to the body
const svg = d3.select("#vis")
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// Load Data
function init() {
    d3.csv("data/data.csv", d => ({
        year: (new Date(d.Date)).getFullYear(),
        isDepressed: d.Depression == "Yes" ? 1 : 0,
        ageRange: d.Age,
        ethnicity: d.Race,
        health: d.Health,
        income: d.Income,
        sex: d.Sex,
        insured: d.HealthInsurance == "Yes" ? "Insured" :
            d.HealthInsurance == "No" ? "Uninsured" :
            "Other/DK/Refused",
        served: d.MilitaryService == "Yes" ? "Served" :
            d.MilitaryService == "No" ? "Not Served" :
            "Other/DK/Refused",
        weight: d.Weight
    })).then(data => {
        document.getElementById("loadingGif").style.visibility = "hidden";
        console.log(data);
        allData = data;
        setupSelectors();
        updatePreset();
        filter();
        loadCircles();
    })
    .catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);

function setupSelectors() {
    function getUniqueValues(field) {
        const uniqueValues = [...new Set(allData.map(d => d[field]))]
            .filter(d => d !== undefined && d !== null && d !== '')
            .sort();
        return ['Any', ...uniqueValues];
    }

    let firstYear = true;

    d3.selectAll('.variable')
        .each(function() {
            const select = d3.select(this);
            const optionKey = select.attr('id').replace('Var', '');
            const field = optionToField[optionKey] || 'year';

            let uniqueValues = getUniqueValues(field);

            if (field == 'year') {
                uniqueValues = uniqueValues.slice(1);
            }

            select.selectAll('option')
                .data(uniqueValues)
                .enter()
                .append('option')
                .text(d => d)
                .attr('value', d => d);

            select.property('value', uniqueValues[0] || '');

            if (!firstYear && field == 'year') {
                select.property('value', uniqueValues[uniqueValues.length - 1] || '');
            } else {
                firstYear = false;
            }
        })
        .on("change", function (event) {
            updateVis();
        });

    // Add event listeners to color pickers
    d3.selectAll('#g1Color, #g2Color')
        .on('input', function() {
            updateVis();
        });
}

function updateVis() {
    filter();
    svg.selectAll('circle').interrupt();
    svg.selectAll('circle').remove();
    svg.selectAll('path').remove();
    svg.selectAll('text').remove();
    svg.selectAll('rect').remove();
    counts = { g1Depressed: 0, g1NotDepressed: 0, g2Depressed: 0, g2NotDepressed: 0 };
    groupColors = {
        1: d3.select('#g1Color').node().value,
        2: d3.select('#g2Color').node().value
    };
    loadCircles();
}

function group_wt(group) {
    return group.reduce((acc, v) => acc + parseFloat(v.weight), 0)
}

function weighted_depression_tab(l) {
    const total_wt = l.reduce((acc, v) => acc + parseFloat(v.weight), 0);
    const dep_wt = l.reduce((acc, v) => v.isDepressed == 1 ? acc + parseFloat(v.weight) : acc, 0);
    return dep_wt / total_wt;
}

function filter() {
    const dropdownValue = (x) => d3.select(`#${x}Var`).node().value;

    const g1vars = ['g1Age', 'g1Sex', 'g1Ethnicity', 'g1Health', 'g1Income', 'g1Insured', 'g1Served'];
    const g2vars = ['g2Age', 'g2Sex', 'g2Ethnicity', 'g2Health', 'g2Income', 'g2Insured', 'g2Served'];

    let group1 = allData.filter(d => {
        for (const dropdownKey of g1vars) {
            let value = dropdownValue(dropdownKey);
            let key = optionToField[dropdownKey];
            if (value === 'Any') continue;
            if (d[key] != value) return false;
        }
        return true;
    });

    let group2 = allData.filter(d => {
        for (const dropdownKey of g2vars) {
            let value = dropdownValue(dropdownKey);
            let key = optionToField[dropdownKey];
            if (value === 'Any') continue;
            if (d[key] != value) return false;
        }
        return true;
    });

    group1before = group1.filter(d => d.year == dropdownValue('startYear'));
    group2before = group2.filter(d => d.year == dropdownValue('startYear'));
    group1after = group1.filter(d => d.year == dropdownValue('endYear'));
    group2after = group2.filter(d => d.year == dropdownValue('endYear'));

    depressionRates = {
        'g1before': weighted_depression_tab(group1before),
        'g1after': weighted_depression_tab(group1after),
        'g2before': weighted_depression_tab(group2before),
        'g2after': weighted_depression_tab(group2after),
    };

    totalPop = {
        'g1before': group_wt(group1before),
        'g1after': group_wt(group1after),
        'g2before': group_wt(group2before),
        'g2after': group_wt(group2after),
    }

    console.log("Depression rates: ", depressionRates);
    console.log("Populations: ", totalPop);
}

function generateBezierPath(p1, p2) {
    const dx = p2.x - p1.x;
    const startCurve = { x: p1.x + dx / 3, y: p1.y };
    const endCurve = { x: p1.x + (2 * dx) / 3, y: p2.y };
    const cp1 = { x: startCurve.x + dx / 6, y: p1.y };
    const cp2 = { x: endCurve.x - dx / 6, y: p2.y };
    return `M${p1.x},${p1.y} L${startCurve.x},${startCurve.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${endCurve.x},${endCurve.y} L${p2.x},${p2.y}`;
}

function addLabels() {
    const x = d3.scaleLinear().domain([0, xMax]).range([curveMargin.x, width - curveMargin.x]);
    const y = d3.scaleLinear().domain([0, xMax]).range([curveMargin.y, height - curveMargin.y]);

    const bigTextSize = width * 0.03;
    const smallTextSize = width * 0.018;

    const startYear = d3.select('#startYearVar').node().value;
    const endYear = d3.select('#endYearVar').node().value;

    svg.append('text')
        .attr('x', curveMargin.x * 0.9)
        .attr('y', height * 0.95)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${bigTextSize}px`)
        .attr('fill', '#333')
        .attr('stroke', 'white')
        .attr('stroke-width', '1')
        .text(startYear);

    svg.append('text')
        .attr('x', width - curveMargin.x * 0.9)
        .attr('y', height * 0.95)
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${bigTextSize}px`)
        .attr('fill', '#333')
        .attr('stroke', 'white')
        .attr('stroke-width', '1')
        .text(endYear);

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height * 0.05 + bigTextSize / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${bigTextSize}px`)
        .attr('fill', '#333')
        .attr('stroke', 'white')
        .attr('stroke-width', '1')
        .text('Depressed');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height * 0.95 + bigTextSize / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${bigTextSize}px`)
        .attr('fill', '#333')
        .attr('stroke', 'white')
        .attr('stroke-width', '1')
        .text('Not Depressed');
    // Group 1 After Labels
    svg.append('text')
        .attr('x', width - curveMargin.x * 0.9)
        .attr('y', curveMargin.y * 0.7)
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', '#333')
        .text('Group 1');

    svg.append('text')
        .attr('id', 'g1DepressedCount')
        .attr('x', width - curveMargin.x * 0.9)
        .attr('y', curveMargin.y)
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[1])
        .text('0 (0%)');
    
    svg.append('rect')
        .attr('id', 'g1D')
        .attr('x', width - curveMargin.x * 0.9)
        .attr('y', curveMargin.y + 5)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill', groupColors[1]);

    svg.append('text')
        .attr('id', 'g1NotDepressedCount')
        .attr('x', width - curveMargin.x * 0.9)
        .attr('y', height - curveMargin.y)
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[1])
        .text('0 (0%)');
  
    svg.append('rect')
        .attr('id', 'g1ND')
        .attr('x', width - curveMargin.x * 0.9)
        .attr('y', curveMargin.y+270)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill',  groupColors[1]);

    // After Group 2 Labels
    svg.append('text')
        .attr('x', width - curveMargin.x * 0.45)
        .attr('y', curveMargin.y * 0.7)
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', '#333')
        .text('Group 2');

    svg.append('text')
        .attr('id', 'g2DepressedCount')
        .attr('x', width - curveMargin.x * 0.45)
        .attr('y', curveMargin.y)
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[2])
        .text('0 (0%)');
    
    svg.append('rect')
        .attr('id', 'g2D')
        .attr('x', width - curveMargin.x * 0.45)
        .attr('y', curveMargin.y + 5)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill', groupColors[2]);

    svg.append('text')
        .attr('id', 'g2NotDepressedCount')
        .attr('x', width - curveMargin.x * 0.45)
        .attr('y', height - curveMargin.y)
        .attr('text-anchor', 'start')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[2])
        .text('0 (0%)');
    
      svg.append('rect')
        .attr('id', 'g2ND')
        .attr('x', width - curveMargin.x * 0.45)
        .attr('y', curveMargin.y+270)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill', groupColors[2]);

    //Bar chart on left hand side to show previous year 
     svg.append('text')
        .attr('x', curveMargin.x * 0.45)
        .attr('y', curveMargin.y * 0.7)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', '#333')
        .text('Group 1');

    svg.append('text')
        .attr('id', 'Lg1DepressedCount')
        .attr('x', curveMargin.x * 0.45)
        .attr('y', curveMargin.y)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[1])
        .text('0 (0%)');
    
    svg.append('rect')
        .attr('id', 'Lg1D')
        .attr('x', curveMargin.x * 0.45 - 70)
        .attr('y', curveMargin.y + 5)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill', groupColors[1]);

    svg.append('text')
        .attr('id', 'Lg1NotDepressedCount')
        .attr('x', curveMargin.x * 0.45)
        .attr('y', height - curveMargin.y)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[1])
        .text('0 (0%)');
  
    svg.append('rect')
        .attr('id', 'Lg1ND')
        .attr('x', curveMargin.x * 0.45 - 70)
        .attr('y', curveMargin.y+270)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill',  groupColors[1]);

    // Before Group 2 Labels
    svg.append('text')
        .attr('x', curveMargin.x * 0.9)
        .attr('y', curveMargin.y * 0.7)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', '#333')
        .text('Group 2');

    svg.append('text')
        .attr('id', 'Lg2DepressedCount')
        .attr('x', curveMargin.x * 0.9)
        .attr('y', curveMargin.y)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[2])
        .text('0 (0%)');
    
    svg.append('rect')
        .attr('id', 'Lg2D')
        .attr('x', curveMargin.x * 0.9 - 70)
        .attr('y', curveMargin.y + 5)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill', groupColors[2]);

    svg.append('text')
        .attr('id', 'Lg2NotDepressedCount')
        .attr('x', curveMargin.x * 0.9)
        .attr('y', height - curveMargin.y)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', `${smallTextSize}px`)
        .attr('fill', groupColors[2])
        .text('0 (0%)');
    
      svg.append('rect')
        .attr('id', 'Lg2ND')
        .attr('x', curveMargin.x * 0.9 - 70)
        .attr('y', curveMargin.y+270)
        .attr('width', 70)
        .attr('height', 0)
        .attr('fill', groupColors[2]);

  
}

function loadCircles() {
    const x = d3.scaleLinear().domain([0, xMax]).range([curveMargin.x , width - curveMargin.x]);
    const y = d3.scaleLinear().domain([0, xMax]).range([curveMargin.y, height - curveMargin.y]);
    const yThreshold = y(xMax / 2);

    const groupCount = Object.keys(depressionRates).length / 2;
    const totalCirclesPerGroup = numCircles / groupCount;
    
    const groupCircleNums = {
        'g1beforeAffected': Math.round(depressionRates['g1before'] * totalCirclesPerGroup),
        'g1beforeUnAffected': Math.round((1 - depressionRates['g1before']) * totalCirclesPerGroup),
        'g1afterAffected': Math.round(depressionRates['g1after'] * totalCirclesPerGroup),
        'g1afterUnAffected': Math.round((1 - depressionRates['g1after']) * totalCirclesPerGroup),
        'g2beforeAffected': Math.round(depressionRates['g2before'] * totalCirclesPerGroup),
        'g2beforeUnAffected': Math.round((1 - depressionRates['g2before']) * totalCirclesPerGroup),
        'g2afterAffected': Math.round(depressionRates['g2after'] * totalCirclesPerGroup),
        'g2afterUnAffected': Math.round((1 - depressionRates['g2after']) * totalCirclesPerGroup),
    };

    // animationDuration = 1
    // randDelayDuration = 1

    for (let i = 0; i < numCircles; i++) {
        let groupStartPct;
        let groupEndPct;

        let group = i % groupCount + 1;
        groupStartPct = groupCircleNums[`g${group}beforeAffected`] / 
            (groupCircleNums[`g${group}beforeAffected`] + groupCircleNums[`g${group}beforeUnAffected`]);
        groupEndPct = groupCircleNums[`g${group}afterAffected`] / 
            (groupCircleNums[`g${group}afterAffected`] + groupCircleNums[`g${group}afterUnAffected`]);


        /*
            For calculating percentages
            Prior studies/literature suggest that people depressed one year have a 20-30%
            chance of being depressed a following year
            Source: I found a source for chronic rates of depression
                https://www.sciencedirect.com/science/article/pii/S0165032721012611#:~:text=Around%2020%25%20%2D%2030%25%20of,chronically%20depressed%20(NCD)%20patients.
                and others agree if you research.
            
            But this is a much different time from when the data was recorded, 
            so that percentage can't be trusted or applied here.
            I just left the start and end percentage remain the same for those who 
            started with or without depression.
        */

        let startAffected = Math.random() < groupStartPct;
        if (groupCircleNums[`g${group}beforeAffected`] == 0) {
            startAffected = false
        } else if (groupCircleNums[`g${group}beforeUnAffected`] == 0) {
            startAffected = true
        }

        if (startAffected) {
            groupCircleNums[`g${group}beforeAffected`]--;
        } else {
            groupCircleNums[`g${group}beforeUnAffected`]--;
        }
        
        const start = {
            x: x(0),
            y: startAffected ?
                y((Math.random() * randRange) - (randRange / 2)) :
                y(xMax + (Math.random() * randRange) - (randRange / 2))
        };

        
        let endAffected = Math.random() < groupEndPct;
        if (groupCircleNums[`g${group}afterAffected`] == 0) {
            endAffected = false
        } else if (groupCircleNums[`g${group}afterUnAffected`] == 0) {
            endAffected = true
        }


        if (endAffected) {
            groupCircleNums[`g${group}afterAffected`]--;
        } else {
            groupCircleNums[`g${group}afterUnAffected`]--;
        }

        const end = {
            x: x(xMax),
            y: endAffected ?
                y((Math.random() * randRange) - (randRange / 2)) :
                y(xMax + (Math.random() * randRange) - (randRange / 2))
        };

        const isDepressedEnd = end.y < yThreshold;

        const path = svg.append("path")
            .attr("d", generateBezierPath(start, end))
            .attr("fill", "none")
            .attr("stroke", "none")
            .attr("stroke-width", 1);

        const pathLength = path.node().getTotalLength();
        const initPoint = path.node().getPointAtLength(0);

        const circle = svg.append("circle")
            .attr("r", circleRadius)
            .attr("fill", groupColors[group])
            .attr("cx", initPoint.x)
            .attr("cy", initPoint.y);

        function displayedNumber(num) {
            result = "Error"

            if (num < 1000) {
                result = `${Math.round(num)}`;
            } else if (num < 1000000) {
                result = `${(num/1000).toFixed(1)}k`
            } else {
                result = `${(num/1000000).toFixed(1)}M`
            }
            return result
        }
        
        function updateCounts() {
            if (group === 1) {
                if (isDepressedEnd) counts.g1Depressed += totalPop.g1after / (numCircles / 2);
                else counts.g1NotDepressed += totalPop.g1after / (numCircles / 2);
            } else {
                if (isDepressedEnd) counts.g2Depressed += totalPop.g2after / (numCircles / 2);
                else counts.g2NotDepressed += totalPop.g2after / (numCircles / 2);
            }

            let g1Total = counts.g1Depressed + counts.g1NotDepressed;
            let g2Total = counts.g2Depressed + counts.g2NotDepressed;
            

            d3.select('#g1DepressedCount')
                .text(`${displayedNumber(counts.g1Depressed)} \t(${((counts.g1Depressed / (g1Total != 0 ? g1Total : 1)) * 100).toFixed(1)}%)`);
            d3.select('#g1NotDepressedCount')
                .text(`${displayedNumber(counts.g1NotDepressed)} (${((counts.g1NotDepressed / (g1Total != 0 ? g1Total : 1)) * 100).toFixed(1)}%)`);
            d3.select('#g2DepressedCount')
                .text(`${displayedNumber(counts.g2Depressed)} (${((counts.g2Depressed / (g2Total != 0 ? g2Total : 1)) * 100).toFixed(1)}%)`);
            d3.select('#g2NotDepressedCount')
                .text(`${displayedNumber(counts.g2NotDepressed)} (${((counts.g2NotDepressed / (g2Total != 0 ? g2Total : 1)) * 100).toFixed(1)}%)`);

            //This is for the bar graphs that grow upward
             const maxBarHeight = 100;

            // Safe totals to avoid divide by zero
            const g1TotalSafe = g1Total !== 0 ? g1Total : 1;
            const g2TotalSafe = g2Total !== 0 ? g2Total : 1;

            // Calculate heights scaled by percentage of total
            const g1DHeight = (counts.g1Depressed / g1TotalSafe) * maxBarHeight;
            const g1NDHeight = (counts.g1NotDepressed / g1TotalSafe) * maxBarHeight;
            const g2DHeight = (counts.g2Depressed / g2TotalSafe) * maxBarHeight;
            const g2NDHeight = (counts.g2NotDepressed / g2TotalSafe) * maxBarHeight;

            // Baseline Y positions for bars
            const g1DBaseY = curveMargin.y + 5;      // Depressed bars grow downward from here (y fixed)
            const g1NDBaseY = curveMargin.y + 270;   // Not depressed bars grow upward (y moves up)
            const g2DBaseY = curveMargin.y + 5;
            const g2NDBaseY = curveMargin.y + 270;


            // Normal Graphs just grow positively 
            d3.select('#g1D')
                .transition()
                .duration(500)
                .attr('y', g1DBaseY)
                .attr('height', g1DHeight);
            d3.select('#g2D')
                .transition()
                .duration(500)
                .attr('y', g2DBaseY)
                .attr('height', g2DHeight);
            // Animate not depressed bars (grow upward with y moving up as height increases)
            d3.select('#g1ND')
                .transition()
                .duration(500)
                .attr('y', g1NDBaseY - g1NDHeight)
                .attr('height', g1NDHeight);
            d3.select('#g2ND')
                .transition()
                .duration(500)
                .attr('y', g2NDBaseY - g2NDHeight)
                .attr('height', g2NDHeight);



            const g1BeforePop = totalPop.g1before;
            d3.select('#Lg1DepressedCount')
                .text(`${displayedNumber(depressionRates.g1before * g1BeforePop)} (${(depressionRates.g1before * 100).toFixed(1)}%)`);

            d3.select('#Lg1NotDepressedCount')
                .text(`${displayedNumber((1 - depressionRates.g1before) * g1BeforePop)} (${((1 - depressionRates.g1before) * 100).toFixed(1)}%)`);

            // Group 2 before-year labels
            const g2BeforePop = totalPop.g2before;
            d3.select('#Lg2DepressedCount')
                .text(`${displayedNumber(depressionRates.g2before * g2BeforePop)} (${(depressionRates.g2before * 100).toFixed(1)}%)`);

            d3.select('#Lg2NotDepressedCount')
                .text(`${displayedNumber((1 - depressionRates.g2before) * g2BeforePop)} (${((1 - depressionRates.g2before) * 100).toFixed(1)}%)`);

            const g1DStaticHeight = depressionRates.g1before * maxBarHeight;
            const g1NDStaticHeight = (1 - depressionRates.g1before) * maxBarHeight;
            const g2DStaticHeight = depressionRates.g2before * maxBarHeight;
            const g2NDStaticHeight = (1 - depressionRates.g2before) * maxBarHeight;

            d3.select('#Lg1D')
                .attr('y', g1DBaseY)
                .attr('height', g1DStaticHeight);

            d3.select('#Lg1ND')
                .attr('y', g1NDBaseY - g1NDStaticHeight)
                .attr('height', g1NDStaticHeight);

            d3.select('#Lg2D')
                .attr('y', g2DBaseY)
                .attr('height', g2DStaticHeight);

            d3.select('#Lg2ND')
                .attr('y', g2NDBaseY - g2NDStaticHeight)
                .attr('height', g2NDStaticHeight);
           
        }

        function animate() {
            circle.transition()
                .delay(Math.random() * randDelayDuration * 1000)
                .duration(animationDuration * 1000)
                .ease(d3.easeLinear)
                .attrTween("transform", function() {
                    return function(t) {
                        const point = path.node().getPointAtLength(t * pathLength);
                        return `translate(${point.x - initPoint.x},${point.y - initPoint.y})`;
                    };
                })
                .on("end", function() {
                    updateCounts();
                    // animate();
                });
        }

        animate();
    }

    console.log(groupCircleNums)
    addLabels();

}

const colorText = (text, color) => `<span style="color: ${color};">${text}</span>`

const dropdownValue = (x) => d3.select(`#${x}Var`).node().value;

const presets = [
        {
            type: "normal",
            text: `Depression rates among the ${colorText("young", "#CB5680")} (18-25) and ${colorText("general population", "#86C1C4")} before and during COVID`,
            fields: {
                startYearVar: 2019,
                endYearVar: 2021,
                g1AgeVar: "18-25",
                g1Color: "#CB5680",
                g2Color: "#86C1C4",
            },
        },
        {
            type: "custom",
            text: "Create your own groups!"
        }
]

let preset = presets[0]

function updatePreset() {
    document.getElementById("presetText").innerHTML = preset.text

    // Exit if custom
    if (preset.type == "custom") {

        document.getElementById("controls").style.display = ""
        return
    }

    document.getElementById("controls").style.display = "none"

    for (const key in preset.fields) {
        console.log(key, d3.select(`#${key}`).node().value, preset.fields[key])
        d3.select(`#${key}`).node().value = preset.fields[key]
    }
}


function changePreset(c) {
    let i = presets.indexOf(preset)
    // this code is janky sorry guys
    if (c < 0) {
        if (i == 0) {
            preset = presets[presets.length - 1]
        } else {
            preset = presets[i - 1]
        }
    }

    if (c > 0) {
        if (i == presets.length - 1) {
            preset = presets[0]
        } else {
            preset = presets[i + 1]
        }
    }

    i = presets.indexOf(preset)

    updatePreset()

    if (i == presets.length - 1) {
        svg.selectAll('circle').interrupt();
        svg.selectAll('circle').remove();
        svg.selectAll('path').remove();
        svg.selectAll('rect').remove();
    } else {
        updateVis()
    }
}
