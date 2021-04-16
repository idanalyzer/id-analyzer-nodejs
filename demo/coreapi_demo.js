const IDAnalyzer = require("idanalyzer");

let CoreAPI = new IDAnalyzer.CoreAPI("Your API Key","US");

CoreAPI.enableAuthentication(true, 2);

/*
CoreAPI.enableVault(true,false,false,false);  // enable vault cloud storage to store document information and image
CoreAPI.setBiometricThreshold(0.6); // make face verification more strict  
CoreAPI.enableAuthentication(true, 'quick'); // check if document is real using 'quick' module  
CoreAPI.enableBarcodeMode(false); // disable OCR and scan for AAMVA barcodes only  
CoreAPI.enableImageOutput(true,true,"url"); // output cropped document and face region in URL format  
CoreAPI.enableDualsideCheck(true); // check if data on front and back of ID matches  
CoreAPI.setVaultData("user@example.com",12345,"AABBCC"); // store custom data into vault  
CoreAPI.restrictCountry("US,CA,AU"); // accept documents from United States, Canada and Australia  
CoreAPI.restrictState("CA,TX,WA"); // accept documents from california, texas and washington  
CoreAPI.restrictType("DI"); // accept only driver license and identification card  
CoreAPI.setOCRImageResize(0); // disable OCR resizing  
CoreAPI.verifyExpiry(true); // check document expiry  
CoreAPI.verifyAge("18-120"); // check if person is above 18  
CoreAPI.verifyDOB("1990/01/01"); // check if person's birthday is 1990/01/01  
CoreAPI.verifyDocumentNumber("X1234567"); // check if the person's ID number is X1234567  
CoreAPI.verifyName("Elon Musk"); // check if the person is named Elon Musk  
CoreAPI.verifyAddress("123 Sunny Rd, California"); // Check if address on ID matches with provided address  
CoreAPI.verifyPostcode("90001"); // check if postcode on ID matches with provided postcode
CoreAPI.enableAMLCheck(true); // enable AML/PEP compliance check
CoreAPI.setAMLDatabase("global_politicians,eu_meps,eu_cors"); // limit AML check to only PEPs
CoreAPI.enableAMLStrictMatch(true); // make AML matching more strict to prevent false positives
CoreAPI.generateContract("Template ID", "PDF", {"email":"user@example.com"}); // generate a PDF document autofilled with data from user ID
*/

// Analyze ID image by passing URL of the ID image (you may also use a local file)
CoreAPI.scan({ document_primary: "sampleid.jpg", biometric_photo: "sampleface.png" }).then(function (response) {
    if(!response.error){
        console.log(response);
        // All the information about this ID will be returned in an associative array
        let data_result = response['result'];
        let authentication_result = response['authentication'];
        let face_result = response['face'];

        // Print result
        console.log(`Hello your name is ${data_result['firstName']} ${data_result['lastName']}`);

        // Parse document authentication results
        if(authentication_result){
            if(authentication_result['score'] > 0.5) {
                console.log("The document uploaded is authentic");
            }else if(authentication_result['score'] > 0.3){
                console.log("The document uploaded looks little bit suspicious");
            }else{
                console.log("The document uploaded is fake");
            }
        }
        // Parse biometric verification results
        if(face_result){
            if(face_result['isIdentical']) {
                console.log("Biometric verification PASSED!");
            }else{
                console.log("Biometric verification FAILED!");
            }
            console.log("Confidence Score: "+face_result['confidence']);
        }
    }else{
        // Error occurred
        console.log(response.error);
    }


}).catch(function (err) {
    console.log(err.message);
});

// Scan both front and back of document
//CoreAPI.scan({ document_primary: "path/to/front.jpg" , document_secondary: "path/to/back.jpg"})

// Scan front side of document with photo face verification
//CoreAPI.scan({ document_primary: "path/to/front.jpg" , biometric_photo: "path/to/user/photo.jpg"})

// Scan front side of document with video face verification
//CoreAPI.scan({ document_primary: "path/to/front.jpg" , biometric_video: "path/to/user/video.mp4", biometric_video_passcode: "1234"})