queue()
    .defer(d3.csv,'/data/Salaries.csv') //Action
    .await(makeGraphs);
    
function makeGraphs(err, theData) {
    var ndx = crossfilter(theData);
    
    theData.forEach(function(d){
        d.salary = parseInt(d.salary);
    })
    
    show_gender_balance(ndx);
    show_discipline_selector(ndx);
    show_average_salary(ndx);
    show_rank_distribution(ndx);
    show_women_proffesors(ndx);
    show_men_proffesors(ndx);
    
    dc.renderAll();
}

function show_gender_balance(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    var group = dim.group();
    
    dc.barChart('#gender-balance')
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left:50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().ticks(10);
}

function show_discipline_selector(ndx) {
    var dim = ndx.dimension(dc.pluck('discipline'));
    var group = dim.group();
    
    dc.selectMenu('#discipline-selector')
        .dimension(dim)
        .group(group);
}

function show_average_salary(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    
    function add_Item(p, v) {
        p.count++;
        p.total += v.salary;
        p.average = p.total / p.count;
        return p;
    }
    
    function remove_Item(p, v) {
        p.count--;
        if(p.count == 0) {
            p.total = 0;
            p.average = 0;
        } else {
            p.total -= v.salary;
            p.average = p.total / p.count;    
        }
        return p;
    }
    
    function initialise() {
        return {count: 0, total: 0, average: 0};
    }
    
    var averageSalaryByGender = dim.group().reduce(add_Item, remove_Item, initialise);
    
    dc.barChart('#average-pay')
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left:50})
        .dimension(dim)
        .group(averageSalaryByGender)
        .valueAccessor(function(d) {
            return d.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(10);
}

function show_rank_distribution(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
        
    function rankByGender(dim, rank) {
        return dim.group().reduce(
            function(p,v) {
                p.total++;
                if(v.rank == rank) {
                    p.match++;
                }
                return p;
            }, function(p,v) {
                p.total--;
                if(v.rank == rank) {
                    p.match--;
                }
                return p;
            }, function() {
                return {total: 0, match: 0};
            });
    }
        
    var profByGender = rankByGender(dim, "Prof");
    var asstProfByGender = rankByGender(dim, "AsstProf");
    var assocProfByGender = rankByGender(dim, "AssocProf");
    
    dc.barChart('#rank-distribution')
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left:125})
        .dimension(dim)
        .group(profByGender, "Prof")
        .stack(asstProfByGender, "AsstProf")
        .stack(assocProfByGender, "AssocProf")
        .valueAccessor(function(d) {
            if(d.value.total > 0) {
                return (d.value.match / d.value.total) * 100;
            } else {
                return 0;
            }
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .legend(dc.legend().x(20).y(20).itemHeight(15).gap(5))
}

function show_women_proffesors(ndx) {
    
}

function show_men_proffesors(ndx) {
    
}