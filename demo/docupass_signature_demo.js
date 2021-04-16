const IDAnalyzer = require("idanalyzer");

let DocuPass = new IDAnalyzer.DocuPass("Your API Key","Your Company Name Inc.","US");

// We need to set an identifier so that we know internally who is signing the document, this string will be returned in the callback. You can use your own user/customer id.
DocuPass.setCustomID("CUSTOMER1234");

// Enable vault cloud storage to store signed document
DocuPass.enableVault(true);

// Set a callback URL where signed document will be sent, you can use docupass_callback.php under this folder as a template to receive the result
DocuPass.setCallbackURL("https://www.your-website.com/docupass_callback.php");

// We want to redirect user back to your website when they are done with document signing, there will be no fail URL unlike identity verification
DocuPass.setRedirectionURL("https://www.your-website.com/document_signed.html","");


/*
 * more settings
DocuPass.setReusable(true); // allow DocuPass URL/QR Code to be used by multiple users
DocuPass.setLanguage("en"); // override auto language detection
DocuPass.setQRCodeFormat("000000","FFFFFF",5,1); // generate a QR code using custom colors and size
DocuPass.hideBrandingLogo(true); // hide branding footer
DocuPass.setCustomHTML("https://www.yourwebsite.com/docupass_template.html"); // use your own HTML/CSS for DocuPass page
DocuPass.smsContractLink("+1333444555"); // Send signing link to user's mobile phone
*/


// Assuming in your contract template you have a dynamic field %{email} and you want to fill it with user email
let prefill = {
    "email": "user@example.com"
};

// Create a signature session
DocuPass.createSignature("Template ID", "PDF", prefill).then(function (response) {
    if(!response.error){
        console.log(response);

        console.log("Scan the QR Code below to sign document: ");
        console.log(response['qrcode']);
        console.log("Or open your mobile browser and navigate to: ");
        console.log(response['url']);
    }else{
        // Error occurred
        console.log(response.error);
    }


}).catch(function (err) {
    console.log(err.message);
});

