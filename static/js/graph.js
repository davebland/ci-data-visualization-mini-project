queue()
    .defer(d3.csv,'/data/Salaries.csv') //Action
    .await(makeGraphs);
    
function makeGraphs(err, theData) {
    console.log(theData);
}