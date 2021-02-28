const IDAnalyzer = require("idanalyzer");

let Vault = new IDAnalyzer.Vault("Your API Key","US");


// List 5 items created on or after 2021/02/25, sort result by first name in ascending order, starting from first item.
Vault.list({filter: ["createtime>=2021/02/25"], orderby: "firstName", sort: "ASC", limit: 5, offset: 0}).then(function (response) {
    if(!response.error){
        console.log(response);
    }else{
        // Error occurred
        console.log(response.error);
    }
}).catch(function (err) {
    console.log(err.message);
});

