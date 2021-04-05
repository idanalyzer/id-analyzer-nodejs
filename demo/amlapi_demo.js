const IDAnalyzer = require("idanalyzer");

let aml = new IDAnalyzer.AMLAPI("Your API Key","US");

// Set AML database to only search the PEP category
aml.setAMLDatabase("global_politicians,eu_cors,eu_meps");

// Search for a politician
aml.searchByName("Joe Biden").then(function (response) {
    console.log(response);
}).catch(function (err) {
    console.log(err.message);
});

// Set AML database to all databases
aml.setAMLDatabase("");

// Search for  a sanctioned ID number
aml.searchByIDNumber("AALH750218HBCLPC02").then(function (response) {
    console.log(response);
}).catch(function (err) {
    console.log(err.message);
});
