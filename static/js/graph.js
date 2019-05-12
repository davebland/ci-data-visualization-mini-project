queue()
    .defer(d3.csv,'/data/Salaries.csv') //Action
    .await(makeGraphs);
    
function makeGraphs(err, theData) {
    var ndx = crossfilter(theData);
    
    theData.forEach(function(d){
        d.salary = parseInt(d.salary);
        d.yrs_service = parseInt(d['yrs.service']);
        d.yrs_since_phd = parseInt(d['yrs.since.phd']);
    })
    
    show_gender_balance(ndx);
    show_discipline_selector(ndx);
    show_average_salary(ndx);
    show_rank_distribution(ndx);
    show_percentage_proffesors(ndx, 'Female', 'women-profs');
    show_percentage_proffesors(ndx, 'Male', 'male-profs');
    show_years_vs_salary(ndx);
    show_phd_vs_salary(ndx);
    
    dc.renderAll();
}

function show_gender_balance(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    var group = dim.group();
    
    dc.barChart('#gender-balance')
        //.width(400)
        //.height(300)
        .margins({top: 10, right: 50, bottom: 30, left:50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
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
        //.width(400)
        //.height(300)
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
        //.width(400)
        //.height(300)
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
        .xAxisLabel("Gender")
        .yAxisLabel("% Dataset")
        .legend(dc.legend().x(20).y(20).itemHeight(15).gap(5))
}

function show_percentage_proffesors(ndx, sex, divid) {
    var percentageProfs = ndx.groupAll().reduce(
        function(p,v) {
            if (v.sex == sex) {
                p.count++;
                if (v.rank == "Prof") {
                    p.are_prof++;
                }
            }
            return p;
        }, function(p,v) {
            if (v.sex == sex) {
                p.count--;
                if (v.rank == "Prof") {
                    p.are_prof--;
                }
            }
            return p;
        }, function() {
            return {count: 0, are_prof: 0};
        }
    );
    
    dc.numberDisplay('#' + divid)
        .formatNumber(d3.format(".2%"))
        .valueAccessor(function(d) {
            if (d.count == 0) {
                return 0;
            } else {
                return (d.are_prof / d.count);
            }
        })
        .group(percentageProfs);
}

function show_years_vs_salary(ndx) {
    
    var genderColors = d3.scale.ordinal()
        .domain(['Female','Male'])
        .range(['pink','blue']);
    
    var yearsDim = ndx.dimension(dc.pluck('yrs_service'));
    var vsSalaryDim = ndx.dimension(function(d) {
        return [d.yrs_service, d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = vsSalaryDim.group();
    var minExperience = yearsDim.bottom(1)[0].yrs_service;
    var maxExperience = yearsDim.top(1)[0].yrs_service;
    
    dc.scatterPlot('#years-vs-salary')
        //.width() - Removed to make responsive to parent element size
        //.height()
        .x(d3.scale.linear().domain([minExperience, maxExperience]))
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel('Salary')
        .xAxisLabel('Years of Service')
        .title(function(d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function(d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(vsSalaryDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}

function show_phd_vs_salary(ndx) {
    
    var genderColors = d3.scale.ordinal()
        .domain(['Female','Male'])
        .range(['pink','blue']);
    
    var yearsDim = ndx.dimension(dc.pluck('yrs_since_phd'));
    var vsSalaryDim = ndx.dimension(function(d) {
        return [d.yrs_since_phd, d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = vsSalaryDim.group();
    var minExperience = yearsDim.bottom(1)[0].yrs_since_phd;
    var maxExperience = yearsDim.top(1)[0].yrs_since_phd;
    
    dc.scatterPlot('#years-since-phd-vs-salary')
        //.width(800)
        //.height(300)
        .x(d3.scale.linear().domain([minExperience, maxExperience]))
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel('Salary')
        .xAxisLabel('Years of Service')
        .title(function(d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function(d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(vsSalaryDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}
