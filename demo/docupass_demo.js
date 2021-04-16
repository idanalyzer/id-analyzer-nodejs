const IDAnalyzer = require("idanalyzer");

let DocuPass = new IDAnalyzer.DocuPass("Your API Key","Your Company Name Inc.","US");

// We need to set an identifier so that we know internally who we are verifying, this string will be returned in the callback. You can use your own user/customer id.
DocuPass.setCustomID("CUSTOMER1234");

// Enable vault cloud storage to store verification results
DocuPass.enableVault(true);

// Set a callback URL where verification results will be sent, you can use docupass_callback.php under this folder as a template
DocuPass.setCallbackURL("https://www.your-website.com/docupass_callback.php");

// We want DocuPass to return document image and user face image in URL format.
DocuPass.setCallbackImage(true, true, 1);

// We will do a quick check on whether user have uploaded a fake ID
DocuPass.enableAuthentication(true, "quick", 0.3);

// Enable photo facial biometric verification with threshold of 0.5
DocuPass.enableFaceVerification(true,1,0.5);

// Users will have only 1 attempt for verification
DocuPass.setMaxAttempt(1);

// We want to redirect user back to your website when they are done with verification
DocuPass.setRedirectionURL("https://www.your-website.com/verification_succeeded.html","https://www.your-website.com/verification_failed.html");



/*
 * more settings
DocuPass.setReusable(true); // allow DocuPass URL/QR Code to be used by multiple users
DocuPass.setLanguage("en"); // override auto language detection
DocuPass.setQRCodeFormat("000000","FFFFFF",5,1); // generate a QR code using custom colors and size
DocuPass.setWelcomeMessage("We need to verify your driver license before you make a rental booking with our company."); // Display your own greeting message
DocuPass.setLogo("https://www.your-website.com/logo.png"); // change default logo to your own
DocuPass.hideBrandingLogo(true); // hide footer logo
DocuPass.restrictCountry("US,CA,AU"); // accept documents from United States, Canada and Australia
DocuPass.restrictState("CA,TX,WA"); // accept documents from california, texas and washington
DocuPass.restrictType("DI"); // accept only driver license and identification card
DocuPass.verifyExpiry(true); // check document expiry
DocuPass.verifyAge("18-120"); // check if person is above 18
DocuPass.verifyDOB("1990/01/01"); // check if person's birthday is 1990/01/01
DocuPass.verifyDocumentNumber("X1234567"); // check if the person's ID number is X1234567
DocuPass.verifyName("Elon Musk"); // check if the person is named Elon Musk
DocuPass.verifyAddress("123 Sunny Rd, California"); // Check if address on ID matches with provided address
DocuPass.verifyPostcode("90001"); // check if postcode on ID matches with provided postcode
DocuPass.setCustomHTML("https://www.yourwebsite.com/docupass_template.html"); // use your own HTML/CSS for DocuPass page
DocuPass.smsVerificationLink("+1333444555"); // Send verification link to user's mobile phone
DocuPass.enablePhoneVerification(true); // get user to input their own phone number for verification
DocuPass.verifyPhone("+1333444555"); // verify user's phone number you already have in your database
DocuPass.enableAMLCheck(true); // enable AML/PEP compliance check
DocuPass.setAMLDatabase("global_politicians,eu_meps,eu_cors"); // limit AML check to only PEPs
DocuPass.enableAMLStrictMatch(true); // make AML matching more strict to prevent false positives
DocuPass.generateContract("Template ID", "PDF", {"somevariable": "somevalue"}); // automate paperwork by generating a document autofilled with ID data
DocuPass.signContract("Template ID", "PDF", {"somevariable": "somevalue"}); // get user to review and sign legal document prefilled with ID data
*/

// Create a verification session for this user
DocuPass.createMobile().then(function (response) {
    if(!response.error){
        console.log(response);

        console.log("Scan the QR Code below to verify your identity: ");
        console.log(response['qrcode']);
        console.log("Or open your mobile browser and type in: ");
        console.log(response['url']);
    }else{
        // Error occurred
        console.log(response.error);
    }


}).catch(function (err) {
    console.log(err.message);
});


// Create Live Mobile Module
// DocuPass.createLiveMobile();

// Create URL Redirection Module
// DocuPass.createRedirection();

// Create Iframe Module
// DocuPass.createIframe();
