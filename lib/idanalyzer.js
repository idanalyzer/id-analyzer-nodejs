const fs = require('fs');
const axios = require('axios');

function isValidURL(string) {
    let res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
}
function isHexColor (hex) {
    return typeof hex === 'string'
        && hex.length === 6
        && !isNaN(Number('0x' + hex))
}
class CoreAPI {
  

    _defaultConfig() {
        return {
            accuracy: 2,
            authenticate: false,
            authenticate_module: 1,
            ocr_scaledown: 1500,
            outputimage: false,
            outputface: false,
            outputmode: "url",
            dualsidecheck: false,
            verify_expiry: true,
            verify_documentno: "",
            verify_name: "",
            verify_dob: "",
            verify_age: "",
            verify_address: "",
            verify_postcode: "",
            country: "",
            region: "",
            type: "",
            checkblocklist: "",
            vault_save: "",
            vault_saveunrecognized: "",
            vault_noduplicate: "",
            vault_automerge: "",
            vault_customdata1: "",
            vault_customdata2: "",
            vault_customdata3: "",
            vault_customdata4: "",
            vault_customdata5: "",
            barcodemode: false,
            biometric_threshold: 0.4
        }
    }

    /**
     * Reset all API configurations except API key and region.
     */
    resetConfig()
    {
        this.config = this._defaultConfig();
    }

    /**
     * Set OCR Accuracy
     * @param {Number} accuracy 0 = Fast, 1 = Balanced, 2 = Accurate
     */
    setAccuracy(accuracy = 2)
    {
        this.config.accuracy = accuracy;
    }



    /**
     * Validate the document to check whether the document is authentic and has not been tampered, and set authentication module
     * @param {Boolean} enabled Enable/Disable Document Authentication
     * @param {*} module Module: 1, 2 or quick
     * @throws {Error}
     */
    enableAuthentication(enabled = false, module = 2)
    {
        this.config['authenticate'] = enabled === true;

        if(enabled && module !== 1 && module !== 2 && module !== 'quick'){
            throw new Error("Invalid authentication module, 1, 2 or 'quick' accepted.");
        }

        this.config['authenticate_module'] = module;
    }

    /**
     * Scale down the uploaded image before sending to OCR engine. Adjust this value to fine tune recognition accuracy on large full-resolution images. Set 0 to disable image resizing.
     * @param {Number} maxScale 0 or 500~4000
     * @throws {Error}
     */
    setOCRImageResize(maxScale = 1500)
    {
        if(maxScale!==0 && (maxScale<500 || maxScale>4000)){
            throw new Error("Invalid scale value, 0, or 500 to 4000 accepted.");
        }
        this.config['ocr_scaledown'] = maxScale;
    }

    /**
     * Set the minimum confidence score to consider faces being identical
     * @param {Number} threshold float between 0 to 1
     * @throws {Error}
     */
    setBiometricThreshold(threshold = 0.4)
    {
        if(threshold<=0 || threshold>1){
            throw new Error("Invalid threshold value, float between 0 to 1 accepted.");
        }

        this.config['biometric_threshold'] = threshold;

    }

    /**
     * Generate cropped image of document and/or face, and set output format [url, base64]
     * @param {Boolean} cropDocument Crop document
     * @param {Boolean} cropFace Crop face
     * @param {String} outputFormat url/base64
     * @throws {Error}
     */
    enableImageOutput(cropDocument = false, cropFace = false, outputFormat = "url")
    {
        if(outputFormat !== 'url' && outputFormat !== 'base64'){
            throw new Error("Invalid output format, 'url' or 'base64' accepted.");
        }
        this.config['outputimage'] = cropDocument === true;
        this.config['outputface'] = cropFace === true;
        this.config['outputmode'] = outputFormat;

    }

    /**
     * Check if the names, document number and document type matches between the front and the back of the document when performing dual-side scan. If any information mismatches error 14 will be thrown.
     * @param {Boolean} enabled
     */
    enableDualsideCheck(enabled = false)
    {
        this.config['dualsidecheck'] = enabled === true;

    }

    /**
     * Check if the document is still valid based on its expiry date.
     * @param {Boolean} enabled Enable/Disable expiry check
     */
    verifyExpiry(enabled = false)
    {
        this.config['verify_expiry'] = enabled === true;
    }

    /**
     * Check if supplied document or personal number matches with document.
     * @param {String} documentNumber Document or personal number requiring validation
     * @throws {Error}
     */
    verifyDocumentNumber(documentNumber = "X1234567")
    {
        if(!documentNumber){
            this.config['verify_documentno'] = "";
        }else{
            this.config['verify_documentno'] = documentNumber;
        }



    }

    /**
     * Check if supplied name matches with document.
     * @param {String} fullName Full name requiring validation
     * @throws {Error}
     */
    verifyName(fullName = "ELON MUSK")
    {
        if(!fullName){
            this.config['verify_name'] = "";
        }else{
            this.config['verify_name'] = fullName;
        }
    }


    /**
     * Check if supplied date of birth matches with document.
     * @param {String} dob Date of birth in YYYY/MM/DD
     * @throws {Error}
     */
    verifyDOB(dob = "1990/01/01")
    {
        if(!dob){
            this.config['verify_dob'] = "";
        }else{
            if(/^(\d{4}\/\d{2}\/\d{2})$/.test(dob) === false){
                throw new Error("Invalid birthday format (YYYY/MM/DD)");
            }

            this.config['verify_dob'] = dob;
        }


    }

    /**
     * Check if the document holder is aged between the given range.
     * @param {String} ageRange Age range, example: 18-40
     * @throws {Error}
     */
    verifyAge(ageRange = "18-99")
    {
        if(!ageRange){
            this.config['verify_age'] = "";
        }else{
            if (/^\d+-\d+/.test( ageRange) === false) {
                throw new Error("Invalid age range format (minAge-maxAge)");
            }

            this.config['verify_age'] = ageRange;
        }


    }

    /**
     * Check if supplied address matches with document.
     * @param {String} address Address requiring validation
     */
    verifyAddress(address = "123 Sample St, California, US")
    {
        if(!address){
            this.config['verify_address'] = "";
        }else{
            this.config['verify_address'] = address;
        }

    }

    /**
     * Check if supplied postcode matches with document.
     * @param {String} postcode Postcode requiring validation
     */
    verifyPostcode(postcode = "90001")
    {
        if(!postcode){
            this.config['verify_postcode'] = "";
        }else{
            this.config['verify_postcode'] = postcode;
        }

    }

    /**
     * Check if the document was issued by specified countries, if not error code 10 will be thrown. Separate multiple values with comma. For example "US,CA" would accept documents from United States and Canada.
     * @param {String} countryCodes ISO ALPHA-2 Country Code separated by comma
     */
    restrictCountry(countryCodes = "US,CA,UK")
    {
        if(!countryCodes){
            this.config['country'] = "";
        }else{
            this.config['country'] = countryCodes;
        }

    }

    /**
     * Check if the document was issued by specified state, if not error code 11 will be thrown. Separate multiple values with comma. For example "CA,TX" would accept documents from California and Texas.
     * @param {String} states State full name or abbreviation separated by comma
     */
    restrictState(states = "CA,TX")
    {
        if(!states){
            this.config['region'] = "";
        }else{
            this.config['region'] = states;
        }

    }

    /**
     * Check if the document was one of the specified types, if not error code 12 will be thrown. For example, "PD" would accept both passport and drivers license.
     * @param {String} documentType P: Passport, D: Driver's License, I: Identity Card
     */
    restrictType(documentType = "DIP")
    {
        if(!documentType){
            this.config['type'] = "";
        }else{
            this.config['type'] = documentType;
        }

    }


    /**
     * Disable Visual OCR and read data from AAMVA Barcodes only
     * @param {Boolean} enabled Enable/Disable Barcode Mode
     */
    enableBarcodeMode(enabled = false)
    {
        this.config['barcodemode'] = enabled === true;

    }


    /**
     * Save document image and parsed information in your secured vault. You can list, search and update document entries in your vault through Vault API or web portal.
     * @param {Boolean} enabled Enable/Disable Vault
     * @param {Boolean} saveUnrecognized Save document image in your vault even if the document cannot be recognized.
     * @param {Boolean} noDuplicateImage Prevent duplicated images from being saved.
     * @param {Boolean} autoMergeDocument Automatically merge images with same document number into a single entry inside vault.
     */
    enableVault(enabled = true, saveUnrecognized = false, noDuplicateImage = false, autoMergeDocument = false)
    {
        this.config['vault_save'] = enabled === true;
        this.config['vault_saveunrecognized'] = saveUnrecognized === true;
        this.config['vault_noduplicate'] = noDuplicateImage === true;
        this.config['vault_automerge'] = autoMergeDocument === true;
    }


    /**
     * Add up to 5 custom strings that will be associated with the vault entry, this can be useful for filtering and searching entries.
     * @param {String} data1 Custom data field 1
     * @param {String} data2 Custom data field 2
     * @param {String} data3 Custom data field 3
     * @param {String} data4 Custom data field 4
     * @param {String} data5 Custom data field 5
     */
    setVaultData(data1 = "", data2 = "", data3 = "", data4 = "", data5 = "" )
    {
        this.config['vault_customdata1'] = data1;
        this.config['vault_customdata2'] = data2;
        this.config['vault_customdata3'] = data3;
        this.config['vault_customdata4'] = data4;
        this.config['vault_customdata5'] = data5;

    }


    /**
     * Initialize Core API with an API key and optional region (US, EU)
     * @param {String} apikey You API key
     * @param {String} region US/EU
     * @throws {Error}
     */
    constructor(apikey, region = "US")
    {
        if(!apikey) throw new Error("Please provide an API key");
        if(!region) throw new Error("Please set an API region (US, EU)");
        this.resetConfig();
        this.apikey = apikey;
        if(region.toUpperCase() === "EU"){
            this.apiendpoint = "https://api-eu.idanalyzer.com/";
        }else if(region.toUpperCase() === "US"){
            this.apiendpoint = "https://api.idanalyzer.com/";
        }else{
            this.apiendpoint = region;
        }

    }

    /**
     * Scan an ID document with Core API, optionally specify document back image, face verification image, face verification video and video passcode
     * @param {String} options.document_primary Front of Document (File path or URL)
     * @param {String} options.document_secondary Back of Document (File path or URL)
     * @param {String} options.biometric_photo Face Photo (File path or URL)
     * @param {String} options.biometric_video Face Video (File path or URL)
     * @param {String} options.biometric_video_passcode Face Video Passcode (4 Digit Number)
     * @return {Object}
     * @throws {Error}
     */
    scan(options){


        let payload = this.config;
        payload["apikey"] = this.apikey;


        if(!options.document_primary){
            throw new Error("Primary document image required.");
        }
        if(isValidURL(options.document_primary)){
            payload['url'] = options.document_primary;
        }else if(fs.existsSync(options.document_primary)){
            payload['file_base64'] = fs.readFileSync(options.document_primary, {encoding: 'base64'});
        }else{
            throw new Error("Invalid primary document image, file not found or malformed URL.");
        }
        if(options.document_secondary){
            if(isValidURL(options.document_secondary)){
                payload['url_back'] = options.document_secondary;
            }else if(fs.existsSync(options.document_secondary)){
                payload['file_back_base64'] = fs.readFileSync(options.document_secondary, {encoding: 'base64'});
            }else {
                throw new Error("Invalid secondary document image, file not found or malformed URL.");
            }
        }
        if(options.biometric_photo){
            if(isValidURL(options.biometric_photo)){
                payload['faceurl'] = options.biometric_photo;
            }else if(fs.existsSync(options.biometric_photo)){
                payload['face_base64'] = fs.readFileSync(options.biometric_photo, {encoding: 'base64'});
            }else {
                throw new Error("Invalid face image, file not found or malformed URL.");
            }
        }
        if(options.biometric_video){
            if(isValidURL(options.biometric_video)){
                payload['videourl'] = options.biometric_video;
            }else if(fs.existsSync(options.biometric_video)){
                payload['video_base64'] = fs.readFileSync(options.biometric_video, {encoding: 'base64'});
            }else {
                throw new Error("Invalid face video, file not found or malformed URL.");
            }
            if(/^([0-9]{4})$/.test(options.biometric_video_passcode) === false){
                throw new Error("Please provide a 4 digit passcode for video biometric verification.");
            }
        }

        let apiURL = this.apiendpoint;
        return new Promise(function (resolve, reject) {
     
            axios.post(apiURL, payload, {timeout: 60, headers: { 'content-type': 'application/json' }}).then(function (response) {
                resolve(response.data);
            }).catch(function (error) {
                if (error.response) {
                    reject(new Error('Connecting to API Server failed: HTTP '+  response.status));
                }else{
                    reject(new Error('Connecting to API Server failed: '+  error.code + " " + error.message));
                }
            });

        });



    }

}

class DocuPass {

    _defaultConfig() {
        return {
            "companyname" : "",
            "callbackurl" : "",
            "biometric" : 0,
            "authenticate_minscore" : 0,
            "authenticate_module" : 2,
            "maxattempt" : 1,
            "documenttype" : "",
            "documentcountry" : "",
            "documentregion" : "",
            "dualsidecheck" : false,
            "verify_expiry" : false,
            "verify_documentno" : "",
            "verify_name" : "",
            "verify_dob" : "",
            "verify_age" : "",
            "verify_address" : "",
            "verify_postcode" : "",
            "successredir" : "",
            "failredir" : "",
            "customid" : "",
            "vault_save" : "",
            "return_documentimage" : "",
            "return_faceimage" : "",
            "return_type" : "",
            "qr_color" : "",
            "qr_bgcolor" : "",
            "qr_size" : "",
            "qr_margin" : "",
            "welcomemessage" : "",
            "nobranding" : "",
            "logo" : "",
            "language" : "",
            "biometric_threshold" : 0.4,
            "reusable" : false
        }
    }
       

    /**
     * Reset all API configurations except API key and region.
     */
    resetConfig()
    {
        this.config = this._defaultConfig();
    }

    /**
     * Set max verification attempt per user
     * @param {Number} max_attempt 1 to 10
     * @throws {Error}
     */
    setMaxAttempt(max_attempt = 1)
    {
        if(!Number.isInteger(max_attempt) || max_attempt<1 || max_attempt>10){
            throw new Error("Invalid max attempt, please specify integer between 1 to 10.");

        }
        this.config['maxattempt'] = max_attempt;
    }

    /**
     * Set a custom string that will be sent back to your server's callback URL, and appended to redirection URLs as a query string. It is useful for identifying your user within your database. This value will be stored under customdata1 under Vault.
     * @param {String} customID A string used to identify your customer internally
     */
    setCustomID(customID = "12345")
    {
        this.config['customid'] = customID;
    }

    /**
     * Display a custom message to the user in the beginning of verification
     * @param {String} message Plain text string
     */
    setWelcomeMessage(message)
    {
        this.config['welcomemessage'] = message;
    }


    /**
     * Replace footer logo with your own logo
     * @param {String} url Logo URL
     */
    setLogo(url = "https://docupass.app/asset/logo1.png")
    {
        this.config['logo'] = url;
    }


    /**
     * Hide all branding logo
     * @param {Boolean} hide
     */
    hideBrandingLogo(hide = false)
    {
        this.config['nobranding'] = hide === true;
    }

    /**
     * DocuPass automatically detects user device language and display corresponding language. Set this parameter to override automatic language detection.
     * @param {String} language Language Code: en fr nl de es zh-TW zh-CN
     */
    setLanguage(language)
    {
        this.config['language'] = language;
    }



    /**
     * Set server-side callback URL to receive verification results
     * @param {String} url Callback URL
     * @throws {Error}
     */
    setCallbackURL(url = "https://www.example.com/docupass_callback.php")
    {
        if(!isValidURL(url)) {
            throw new Error("Invalid URL, the host does not appear to be a remote host.");
        }
        this.config['callbackurl'] = url;
    }


    /**
     * Redirect client browser to set URLs after verification. DocuPass reference code and customid will be appended to the end of URL, e.g. https://www.example.com/success.php?reference=XXXXXXXX&customid=XXXXXXXX
     * @param {String} successURL Redirection URL after verification succeeded
     * @param {String} failURL Redirection URL after verification failed
     * @throws {Error}
     */
    setRedirectionURL(successURL = "https://www.example.com/success.php", failURL = "https://www.example.com/failed.php")
    {
        if(!isValidURL(successURL)) {
            throw new Error("Invalid URL format for success URL");
        }
        if(!isValidURL(failURL)) {
            throw new Error("Invalid URL format for fail URL");
        }


        this.config['successredir'] = successURL;
        this.config['failredir'] = failURL;
    }


    /**
     * Validate the document to check whether the document is authentic and has not been tampered
     * @param {Boolean} enabled Enable/Disable Document Authentication
     * @param {*} module Module: 1, 2 or quick
     * @param {Number} minimum_score Minimum score to pass verification
     * @throws {Error}
     */
    enableAuthentication(enabled = false, module = 2, minimum_score = 0.3)
    {
        if(enabled === false){
            this.config['authenticate_minscore'] = 0;
        }else{
            if(isNaN(parseFloat(minimum_score)) || minimum_score<0 || minimum_score>1){
                throw new Error("Invalid minimum score, please specify float between 0 to 1.");
            }
            if(enabled && module !== 1 && module !== 2 && module !== 'quick'){
                throw new Error("Invalid authentication module, 1, 2 or 'quick' accepted.");
            }
            this.config['authenticate_module'] = module;
            this.config['authenticate_minscore'] = minimum_score;
        }
    }



    /**
     * Whether users will be required to submit a selfie photo or record selfie video for facial verification.
     * @param {Boolean} enabled Enable/Disable Facial Biometric Verification
     * @param {Number} verification_type 1 for photo verification, 2 for video verification
     * @param {Number} threshold Minimum confidence score required to pass verification, value between 0 to 1
     * @throws {Error}
     */
    enableFaceVerification(enabled = false, verification_type = 1, threshold = 0.4)
    {
        if(enabled === false){
            this.config['biometric'] = 0;
        }else{
            if(verification_type === 1 || verification_type === 2 ){
                this.config['biometric'] = verification_type;
                this.config['biometric_threshold'] = threshold;
            }else{
                throw new Error("Invalid verification type, 1 for photo verification, 2 for video verification.");
            }
        }
    }


    /**
     * Enabling this parameter will allow multiple users to verify their identity through the same URL, a new DocuPass reference code will be generated for each user automatically.
     * @param {Boolean} reusable Set true to allow unlimited verification for a single DocuPass session
     */
    setReusable(reusable = false)
    {

        this.config['reusable'] = reusable === true;


    }


    /**
     * Enable/Disable returning user uploaded document and face image in callback, and image data format.
     * @param {Boolean} return_documentimage Return document image in callback data
     * @param {Boolean} return_faceimage Return face image in callback data
     * @param {Number} return_type Image type: 0=base64, 1=url
     */
    setCallbackImage(return_documentimage = true, return_faceimage = true, return_type = 1)
    {

        this.config['return_documentimage'] = return_documentimage === true;
        this.config['return_faceimage'] = return_faceimage === true;
        this.config['return_type'] = return_type === 0? 0:1;

    }


    /**
     * Configure QR code generated for DocuPass Mobile and Live Mobile
     * @param {String} foregroundColor Image foreground color HEX code
     * @param {String} backgroundColor Image background color HEX code
     * @param {Number} size Image size: 1 to 50
     * @param {Number} margin Image margin: 1 to 50
     * @throws {Error}
     */
    setQRCodeFormat(foregroundColor = "000000", backgroundColor = "FFFFFF", size = 5, margin = 1)
    {
        if(!isHexColor(foregroundColor)){
            throw new Error("Invalid foreground color HEX code");
        }
        if(!isHexColor(foregroundColor)){
            throw new Error("Invalid background color HEX code");
        }

        if(!Number.isInteger(size)){
            throw new Error("Invalid image size");
        }
        if(!Number.isInteger(margin)){
            throw new Error("Invalid margin");
        }


        this.config['qr_color'] = foregroundColor;
        this.config['qr_bgcolor'] = backgroundColor;
        this.config['qr_size'] = size;
        this.config['qr_margin'] = margin;
    }

    /**
     * Check if the names, document number and document type matches between the front and the back of the document when performing dual-side scan. If any information mismatches error 14 will be thrown.
     * @param {Boolean} enabled
     */
    enableDualsideCheck(enabled = false)
    {
        this.config['dualsidecheck'] = enabled === true;

    }

    /**
     * Check if the document is still valid based on its expiry date.
     * @param {Boolean} enabled Enable/Disable expiry check
     */
    verifyExpiry(enabled = false)
    {
        this.config['verify_expiry'] = enabled === true;
    }

    /**
     * Check if supplied document or personal number matches with document.
     * @param {String} documentNumber Document or personal number requiring validation
     * @throws {Error}
     */
    verifyDocumentNumber(documentNumber = "X1234567")
    {
        if(!documentNumber){
            this.config['verify_documentno'] = "";
        }else{
            this.config['verify_documentno'] = documentNumber;
        }



    }

    /**
     * Check if supplied name matches with document.
     * @param {String} fullName Full name requiring validation
     * @throws {Error}
     */
    verifyName(fullName = "ELON MUSK")
    {

        if(!fullName){
            this.config['verify_name'] = "";
        }else{
            this.config['verify_name'] = fullName;
        }

    }


    /**
     * Check if supplied date of birth matches with document.
     * @param {String} dob Date of birth in YYYY/MM/DD
     * @throws {Error}
     */
    verifyDOB(dob = "1990/01/01")
    {
        if(!dob){
            this.config['verify_dob'] = "";
        }else{
            if(/^(\d{4}\/\d{2}\/\d{2})$/.test(dob) === false){
                throw new Error("Invalid birthday format (YYYY/MM/DD)");
            }

            this.config['verify_dob'] = dob;
        }


    }

    /**
     * Check if the document holder is aged between the given range.
     * @param {String} ageRange Age range, example: 18-40
     * @throws {Error}
     */
    verifyAge(ageRange = "18-99")
    {
        if(!ageRange){
            this.config['verify_age'] = "";
        }else{
            if (/^(\d+-\d+)$/.test(ageRange) === false) {
                throw new Error("Invalid age range format (minAge-maxAge)");
            }

            this.config['verify_age'] = ageRange;
        }


    }

    /**
     * Check if supplied address matches with document.
     * @param {String} address Address requiring validation
     */
    verifyAddress(address = "123 Sample St, California, US")
    {
        if(!address){
            this.config['verify_address'] = "";
        }else{
            this.config['verify_address'] = address;
        }

    }

    /**
     * Check if supplied postcode matches with document.
     * @param {String} postcode Postcode requiring validation
     */
    verifyPostcode(postcode = "90001")
    {
        if(!postcode){
            this.config['verify_postcode'] = "";
        }else{
            this.config['verify_postcode'] = postcode;
        }

    }

    /**
     * Check if the document was issued by specified countries, if not error code 10 will be thrown. Separate multiple values with comma. For example "US,CA" would accept documents from United States and Canada.
     * @param {String} countryCodes ISO ALPHA-2 Country Code separated by comma
     */
    restrictCountry(countryCodes = "US,CA,UK")
    {
        if(!countryCodes){
            this.config['documentcountry'] = "";
        }else{
            this.config['documentcountry'] = countryCodes;
        }

    }

    /**
     * Check if the document was issued by specified state, if not error code 11 will be thrown. Separate multiple values with comma. For example "CA,TX" would accept documents from California and Texas.
     * @param {String} states State full name or abbreviation separated by comma
     */
    restrictState(states = "CA,TX")
    {
        if(!states){
            this.config['documentregion'] = "";
        }else{
            this.config['documentregion'] = states;
        }

    }

    /**
     * Only accept document of specified types. For example, "PD" would accept both passport and drivers license.
     * @param {String} documentType P: Passport, D: Driver's License, I: Identity Card
     */
    restrictType(documentType = "DIP")
    {
        if(!documentType){
            this.config['documenttype'] = "";
        }else{
            this.config['documenttype'] = documentType;
        }

    }

    /**
     * Save document image and parsed information in your secured vault. You can list, search and update document entries in your vault through Vault API or web portal.
     * @param {Boolean} enabled Enable/Disable Vault
     */
    enableVault(enabled = true)
    {
        this.config['vault_save'] = enabled === true;
    }


    /**
     * Initialize DocuPass API with an API key, company name and optional region (US, EU)
     * @param {String} apikey You API key
     * @param {String} companyName Your company name
     * @param {String} region US/EU
     * @throws {Error}
     */
    constructor(apikey, companyName = "My Company Name", region = "US")
    {
        if(!apikey) throw new Error("Please provide an API key");
        if(!companyName) throw new Error("Please provide your company name");
        if(!region) throw new Error("Please set an API region (US, EU)");
        this.resetConfig();
        this.apikey = apikey;
        this.config['companyname'] = companyName;
        if(region.toUpperCase() === "EU"){
            this.apiendpoint = "https://api-eu.idanalyzer.com/";
        }else if(region.toUpperCase() === 'US'){
            this.apiendpoint = "https://api.idanalyzer.com/";
        }else{
            this.apiendpoint = region;
        }

    }

    /**
     * Create a DocuPass session for embedding in web page as iframe
     * @return {Promise<Object>}
     * @throws {Error}
     */
    createIframe(){
        return this._create(0);
    }

    /**
     * Create a DocuPass session for users to open on mobile phone, or embedding in mobile app
     * @return {Promise<Object>}
     * @throws {Error}
     */
    createMobile(){
        return this._create(1);
    }

    /**
     * Create a DocuPass session for users to open in any browser
     * @return {Promise<Object>}
     * @throws {Error}
     */
    createRedirection(){
        return this._create(2);
    }

    /**
     * Create a DocuPass Live Mobile verification session for users to open on mobile phone
     * @return {Promise<Object>}
     * @throws {Error}
     */
    createLiveMobile(){
        return this._create(3);
    }


    _create(docupass_module){

        let payload = this.config;
        payload["apikey"] = this.apikey;
        payload["type"] = docupass_module;

        let apiURL = this.apiendpoint +"docupass/create";
        return new Promise(function (resolve, reject) {
            axios.post(apiURL, payload, {timeout: 15, headers: { 'content-type': 'application/json' }}).then(function (response) {
                resolve(response.data);
            }).catch(function (error) {
                if (error.response) {
                    reject(new Error('Connecting to API Server failed: HTTP '+  response.status));
                }else{
                    reject(new Error('Connecting to API Server failed: '+  error.code + " " + error.message));
                }
            });


        });

    }


    /**
     * Validate a data received through DocuPass Callback against DocuPass Server to prevent request spoofing
     * @return {Promise<Boolean>}
     * @throws {Error}
     */
    validate(reference, hash){

        let payload ={
            apikey: this.apikey,
            reference: reference,
            hash: hash
        }

        let apiURL = this.apiendpoint +"docupass/validate";
        return new Promise(function (resolve, reject) {

            axios.post(apiURL, payload, {timeout: 15, headers: { 'content-type': 'application/json' }}).then(function (response) {
                resolve(response.data.success === true);
            }).catch(function (error) {
                if (error.response) {
                    reject(new Error('Connecting to API Server failed: HTTP '+  response.status));
                }else{
                    reject(new Error('Connecting to API Server failed: '+  error.code + " " + error.message));
                }
            });


        });


    }
}

class Vault {

    /**
     * Get a single vault entry
     * @param {String} id Vault entry ID
     * @return {Promise<Object>}
     * @throws {Error}
     */
    get(id)
    {
        if(!id){
            throw new Error("Vault entry ID required.");
        }
        return this._callAPI("get", {id:id});

    }


    /**
     * List multiple vault entries with optional filter, sorting and paging arguments
     * @param {Object} filter Array of filter statements, refer to https://developer.idanalyzer.com/vaultapi.html for filter construction
     * @param {String} orderby Field name used to order the results, refer to https://developer.idanalyzer.com/vaultapi.html for available fields
     * @param {String} sort Sort results by ASC = Ascending, DESC = DESCENDING
     * @param {Number} limit Number of results to return
     * @param {Number} offset Offset the first result using specified index
     * @return {Promise<Object>}
     * @throws {Error}
     */
    list(filter = {}, orderby = "createtime", sort = "DESC", limit = 10, offset = 0)
    {
        return this._callAPI("list", {filter:filter,orderby:orderby,sort:sort,limit:limit,offset:offset});


    }


    /**
     * List multiple vault entries with optional filter, sorting and paging arguments
     * @param {String} id Vault entry ID
     * @param {Object} data Key-value pairs of the field name and its value
     * @return {Promise<Object>}
     * @throws {Error}
     */
    update(id, data = {})
    {
        if(!id ){
            throw new Error("Vault entry ID required.");
        }
        if(Object.keys(data).length<1){
            throw new Error("Data required.");
        }
        data['id'] = id;
        return this._callAPI("update", data);

    }

    /**
     * Delete a single or multiple vault entries
     * @param {*} id Vault entry ID or array of IDs
     * @return {Promise<Object>}
     * @throws {Error}
     */
    delete(id)
    {
        if(!id){
            throw new Error("Vault entry ID required.");
        }

        return this._callAPI("delete", {id:id});


    }


    /**
     * Delete a single or multiple vault entries
     * @param {String} id Vault entry ID or array of IDs
     * @param {String} image Image file path or URL
     * @param {Number} type Type of image: 0 = document, 1 = person
     * @return {Promise<Object>} New image object
     * @throws {Error}
     */
    addImage(id, image, type = 0)
    {
        if(!id){
            throw new Error("Vault entry ID required.");
        }
        if(type !== 0 && type!==1){
            throw new Error("Invalid image type, 0 or 1 accepted.");
        }
        let payload = {id:id, type:type};
        if(isValidURL(image)){
            payload['imageurl'] = image;
        }else if(fs.existsSync(image)){
            payload['image'] = fs.readFileSync(image, {encoding: 'base64'});
        }else{
            throw new Error("Invalid image, file not found or malformed URL.");
        }

        return this._callAPI("addimage", payload);

    }


    /**
     * Delete an image from vault
     * @param {String} vaultId Vault entry ID
     * @param {String} imageId Image ID
     * @return {Promise<Object>}
     * @throws {Error}
     */
    deleteImage(vaultId,imageId)
    {
        if(!vaultId){
            throw new Error("Vault entry ID required.");
        }
        if(!imageId){
            throw new Error("Image ID required.");
        }

        return this._callAPI("deleteimage", {id:vaultId, imageid:imageId});

    }


    /**
     * Search vault using a person's face image
     * @param {String} image Face image file path or URL
     * @param {Number} maxEntry Number of entries to return, 1 to 10.
     * @param {Number} threshold Minimum confidence score required for face matching
     * @return {Promise<Object>} List of vault entries
     * @throws {Error}
     */
    searchFace(image, maxEntry = 10, threshold = 0.5)
    {

        let payload = {maxentry:maxEntry, threshold:threshold};
        if(isValidURL(image)){
            payload['imageurl'] = image;
        }else if(fs.existsSync(image)){
            payload['image'] = fs.readFileSync(image, {encoding: 'base64'});
        }else{
            throw new Error("Invalid image, file not found or malformed URL.");
        }

        return this._callAPI("searchface", payload);

    }

    /**
     * Train vault for face search
     * @return {Promise<Object>}
     * @throws {Error}
     */
    trainFace()
    {
        return this._callAPI("train");

    }

    /**
     * Get vault training status
     * @return {Promise<Object>}
     * @throws {Error}
     */
    trainingStatus()
    {
        return this._callAPI("trainstatus");

    }


    /**
     * Initialize Vault API with an API key, and optional region (US, EU)
     * @param {String} apikey You API key
     * @param {String} region US/EU
     * @throws {Error}
     */
    constructor(apikey, region = "US")
    {
        if(!apikey) throw new Error("Please provide an API key");
        if(!region) throw new Error("Please set an API region (US, EU)");
        this.apikey = apikey;
        if(region.toUpperCase() === 'EU'){
            this.apiendpoint = "https://api-eu.idanalyzer.com/";
        }else if(region.toUpperCase() === "US"){
            this.apiendpoint = "https://api.idanalyzer.com/";
        }else{
            this.apiendpoint = region;
        }

    }

    _callAPI(action, payload = {}){

        payload.apikey = this.apikey;
        let apiURL = this.apiendpoint + "vault/" + action;
        return new Promise(function (resolve, reject) {


            axios.post(apiURL , payload, {timeout: 60, headers: { 'content-type': 'application/json' }}).then(function (response) {
                if(response.data['error']){
                    reject(new Error(response.data['error']['code']+": "+response.data['error']['message']));
                }else{
                    resolve(response.data) ;
                }
            }).catch(function (error) {
                if (error.response) {
                    reject(new Error('Connecting to API Server failed: HTTP '+  response.status));
                }else{
                    reject(new Error('Connecting to API Server failed: '+  error.code + " " + error.message));
                }
            });





        });



    }

}

module.exports = { CoreAPI, DocuPass, Vault }


