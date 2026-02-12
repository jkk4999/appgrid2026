import {TestExpression} from '../../appInterfaces/grid/gridInterfaces'

export const testExpressions: TestExpression[] = [
// number tests
{
   name: 'AR > 10M',
   expression: '{AnnualRevenue} > 10000000000'
},
{
   name: 'AR >= 10M',
   expression: '{AnnualRevenue} >= 10000000000'
},
{
   name: 'AR < 10M',
   expression: '{AnnualRevenue} < 10000000000'
},
{
   name: 'AR <= 10M',
   expression: '{AnnualRevenue} <= 10000000000'
},
{
   name: 'AR + 10M',
   expression: '{AnnualRevenue} + 10000000000'
},
{
   name: 'AR - 10M',
   expression: '{AnnualRevenue} - 10000000000'
},
{
   name: 'AR * 2',
   expression: '{AnnualRevenue} * 2'
},
{
   name: 'AR / 2',
   expression: '{AnnualRevenue} / 2'
},
{
   name: 'AR == 10M',
   expression: '{AnnualRevenue} == 10000000'
},
{
   name: 'AR != 10M',
   expression: '{AnnualRevenue} != 10000000'
},
{
   name: 'ABS(-23)',
   expression: 'ABS(-23)'
},
{
   name: 'CEILING(45.6)',
   expression: 'CEILING(45.6)'
},
{
   name: 'FLOOR(33.3)',
   expression: 'FLOOR(33.3)'
},
{
   name: 'ROUND(49.8)',
   expression: 'ROUND(49.8)'
},
{
   name: 'MIN(4, 5, 6)',
   expression: 'MIN(4, 5, 6)'
},
{
   name: 'MIN({NumberOfEmployees}, 6)',
   expression: 'MIN({NumberOfEmployees}, 6)'
},
{
   name: 'MAX(4, 5, 6)',
   expression: 'MAX(4, 5, 6)'
},
{
   name: 'MAX({NumberOfEmployees}, 6)',
   expression: 'MAX({NumberOfEmployees}, 6)'
},
{
   name: 'AVG(4, 5, 6)',
   expression: 'AVG(4, 5, 6)'
},
{
   name: 'AVG({NumberOfEmployees}, 6)',
   expression: 'AVG({NumberOfEmployees}, 6)'
},
{
   name: 'SUB(a, b)',
   expression: 'SUB({NumberOfEmployees}, 1000)'
},
{
   name: 'MUL(a, b)',
   expression: 'MUL({NumberOfEmployees}, 10)'
},
{
   name: 'DIV(a, b)',
   expression: 'DIV({NumberOfEmployees}, 10)'
},
{
   name: 'MOD(a, b)',
   expression: 'MOD({NumberOfEmployees}, 10)'
},
{
   name: 'POW(2, 4)',
   expression: 'POW(2, 4)'
},
// string tests
{
   name: 'String ==',
   expression: '{Name} == "Walmart"'
},
{
   name: 'String !=',
   expression: '{Ownership} != "Banking"'
},
{
   name: 'String Contains',
   expression: 'CONTAINS({Ownership}, "sub")',
},
{
   name: 'String StartsWith',
   expression: 'STARTS_WITH({Ownership}, "Sub")'
},
{
   name: 'String EndsWith',
   expression: 'ENDS_WITH({Ownership}, "iary")'
},
{
   name: 'String LEN',
   expression: 'LEN({Ownership})',
},
{
   name: 'String Substring',
   expression: 'SUBSTRING({Ownership}, 1, 5)'
},
{
   name: 'String Replace',
   expression: 'REPLACE({Ownership}, "Sub", "XXX")'
},
{
   name: 'String Concat',
   expression: 'CONCAT({Ownership}, "XXX", "ZZZ")'
},
// date tests
{
   name: 'Current Day',
   expression: 'CURRENT_DAY()'
},
{
   name: 'Day',
   expression: 'DAY(NOW())'
},
{
   name: 'Week',
   expression: 'WEEK(NOW())'
},
{
   name: 'Month',
   expression: 'MONTH(NOW())'
},
{
   name: 'Year',
   expression: 'YEAR(NOW())'
},
{
   name: 'Add Days',
   expression: 'ADD_DAYS(NOW(), 7)'
},
{
   name: 'Add Weeks',
   expression: 'ADD_WEEKS(NOW(), 7)'
},
{
   name: 'Add Months',
   expression: 'ADD_MONTHS(NOW(), 7)'
},
{
   name: 'Add Years',
   expression: 'ADD_YEARS(NOW(), 7)'
},
{
   name: 'Diff Days',
   expression: 'DIFF_DAYS(NOW() + 7, NOW())'
},
{
   name: 'Diff Weeks',
   expression: 'DIFF_WEEKS(ADD_WEEKS(NOW(), 7), NOW())'
},
{
   name: 'Diff Months',
   expression: 'DIFF_MONTHS(ADD_MONTHS(NOW(), 7), NOW())'
},
{
   name: 'Diff Years',
   expression: 'DIFF_YEARS(ADD_YEARS(NOW(), 7), NOW())'
},
{
   name: 'Date ==',
   expression: '{LastViewedDate} == NOW()'
},
{
   name: 'Date !=',
   expression: '{LastViewedDate} != NOW()'
},
{
   name: 'Date <',
   expression: '{LastViewedDate} < NOW()'
},
{
   name: 'Date <=',
   expression: '{LastViewedDate} <= NOW()'
},
{
   name: 'Date >',
   expression: 'NOW() > {LastViewedDate}'
},
{
   name: 'Date >=',
   expression: 'NOW() >= {LastViewedDate}'
},
// logical tests
{
   name: 'AR && Ownership',
   expression: '{AnnualRevenue} > 10000000000 && {Ownership} == "Subsidiary"',
},
{
   name: 'AR || Ownership',
   expression: '{AnnualRevenue} > 10000000000 || {Ownership} == "Subsidiary"',
},
// parentheses
{
   name: '() Test 1',
   expression: '{AnnualRevenue} > 10000000000 && ({Ownership} == "Subsidiary" || {Name} == "Walmart")'
},
{
   name: '() Test 2',
   expression: '{AnnualRevenue} <= 10000000000 && ({Ownership} == "Subsidiary" || {Name} != "Walmart")'
},
]