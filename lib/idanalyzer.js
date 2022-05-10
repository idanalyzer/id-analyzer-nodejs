const fs = require('fs');
const axios = require('axios');
const client_library = "nodejs-sdk";
function isValidURL(string) {
    let res = string.match(/(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/g);
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
            "accuracy": 2,
            "authenticate": false,
            "authenticate_module": 1,
            "ocr_scaledown": 2000,
            "outputimage": false,
            "outputface": false,
            "outputmode": "url",
            "dualsidecheck": false,
            "verify_expiry": false,
            "verify_documentno": "",
            "verify_name": "",
            "verify_dob": "",
            "verify_age": "",
            "verify_address": "",
            "verify_postcode": "",
            "country": "",
            "region": "",
            "type": "",
            "checkblocklist": false,
            "vault_save": true,
            "vault_saveunrecognized": false,
            "vault_noduplicate": false,
            "vault_automerge": false,
            "vault_customdata1": "",
            "vault_customdata2": "",
            "vault_customdata3": "",
            "vault_customdata4": "",
            "vault_customdata5": "",
            "barcodemode": false,
            "biometric_threshold": 0.4,
            "aml_check": false,
            "aml_strict_match": false,
            "aml_database": "",
            "contract_generate": "",
            "contract_format": "",
            "contract_prefill_data": "",
            "client": client_library
        }
    }

    /**
     * Initialize Core API with an API key and optional region (US, EU)
     * @param {string} apikey You API key
     * @param {string} region US/EU
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
     * Reset all API configurations except API key and region.
     */
    resetConfig()
    {
        this.config = this._defaultConfig();
    }

    /**
     * Set OCR Accuracy
     * @param {number} accuracy 0 = Fast, 1 = Balanced, 2 = Accurate
     */
    setAccuracy(accuracy = 2)
    {
        this.config.accuracy = accuracy;
    }



    /**
     * Validate the document to check whether the document is authentic and has not been tampered, and set authentication module
     * @param {boolean} enabled Enable or disable  Document Authentication
     * @param {*} module Module: 1, 2 or quick
     * @throws {Error}
     */
    enableAuthentication(enabled = false, module = 2)
    {
        this.config['authenticate'] = enabled === true;

        if(enabled && module != "1" && module != "2" && module != 'quick'){
            throw new Error("Invalid authentication module, 1, 2 or 'quick' accepted.");
        }

        this.config['authenticate_module'] = module;
    }

    /**
     * Scale down the uploaded image before sending to OCR engine. Adjust this value to fine tune recognition accuracy on large full-resolution images. Set 0 to disable image resizing.
     * @param {number} maxScale 0 or 500~4000
     * @throws {Error}
     */
    setOCRImageResize(maxScale = 2000)
    {
        if(maxScale!==0 && (maxScale<500 || maxScale>4000)){
            throw new Error("Invalid scale value, 0, or 500 to 4000 accepted.");
        }
        this.config['ocr_scaledown'] = maxScale;
    }

    /**
     * Set the minimum confidence score to consider faces being identical
     * @param {number} threshold float between 0 to 1
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
     * @param {boolean} cropDocument Enable or disable document cropping
     * @param {boolean} cropFace Enable or disable face cropping
     * @param {string} outputFormat "url" or "base64", defaults to "url"
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
     * @param {boolean} enabled
     */
    enableDualsideCheck(enabled = false)
    {
        this.config['dualsidecheck'] = enabled === true;

    }


    /**
     * Check document holder's name and document number against ID Analyzer AML Database for sanctions, crimes and PEPs.
     * @param {boolean} enabled Enable or disable AML/PEP check
     */
    enableAMLCheck(enabled = false)
    {
        this.config["aml_check"] = enabled === true;
    }

    /**
     * Specify the source databases to perform AML check, if left blank, all source databases will be checked. Separate each database code with comma, for example: un_sc,us_ofac. For full list of source databases and corresponding code visit AML API Overview.
     * @param {string} databases Database codes separated by comma
     */
    setAMLDatabase(databases = "au_dfat,ca_dfatd,ch_seco,eu_fsf,fr_tresor_gels_avoir,gb_hmt,ua_sfms,un_sc,us_ofac,eu_cor,eu_meps,global_politicians,interpol_red")
    {
        this.config["aml_database"] = databases;
    }

    /**
     * By default, entities with identical name or document number will be considered a match even though their birthday or nationality may be unknown. Enable this parameter to reduce false-positives by only matching entities with exact same nationality and birthday.
     * @param {boolean} enabled Enable or disable AML strict match mode
     */
    enableAMLStrictMatch(enabled = false)
    {
        this.config["aml_strict_match"] = enabled === true;
    }


    /**
     * Check if the document is still valid based on its expiry date.
     * @param {boolean} enabled Enable or disable  expiry check
     */
    verifyExpiry(enabled = false)
    {
        this.config['verify_expiry'] = enabled === true;
    }

    /**
     * Check if supplied document or personal number matches with document.
     * @param {string} documentNumber Document or personal number requiring validation
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
     * @param {string} fullName Full name requiring validation
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
     * @param {string} dob Date of birth in YYYY/MM/DD
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
     * @param {string} ageRange Age range, example: 18-40
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
     * @param {string} address Address requiring validation
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
     * @param {string} postcode Postcode requiring validation
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
     * @param {string} countryCodes ISO ALPHA-2 Country Code separated by comma
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
     * @param {string} states State full name or abbreviation separated by comma
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
     * @param {string} documentType P: Passport, D: Driver's License, I: Identity Card
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
     * @param {boolean} enabled Enable or disable  Barcode Mode
     */
    enableBarcodeMode(enabled = false)
    {
        this.config['barcodemode'] = enabled === true;

    }


    /**
     * Save document image and parsed information in your secured vault. You can list, search and update document entries in your vault through Vault API or web portal.
     * @param {boolean} enabled Enable or disable  Vault
     * @param {boolean} saveUnrecognized Save document image in your vault even if the document cannot be recognized.
     * @param {boolean} noDuplicateImage Prevent duplicated images from being saved.
     * @param {boolean} autoMergeDocument Automatically merge images with same document number into a single entry inside vault.
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
     * @param {string} data1 Custom data field 1
     * @param {string} data2 Custom data field 2
     * @param {string} data3 Custom data field 3
     * @param {string} data4 Custom data field 4
     * @param {string} data5 Custom data field 5
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
     * Set an API parameter and its value, this function allows you to set any API parameter without using the built-in functions
     * @param {string} parameterKey Parameter key
     * @param {string} parameterValue Parameter value
     * @return void
     */
    setParameter(parameterKey, parameterValue)
    {
        this.config[parameterKey] = parameterValue;
    }


    /**
     * Generate legal document using data from user uploaded ID
     * @param {string} templateId Contract Template ID displayed under web portal
     * @param {string} format Output file format: PDF, DOCX or HTML
     * @param {object} prefillData Object or JSON string, to autofill dynamic fields in contract template.
     * @throws {Error}
     */
    generateContract(templateId, format = "PDF", prefillData = {})
    {
        if (!templateId) {
            throw new Error("Invalid template ID");
        }
        this.config['contract_generate'] = templateId;
        this.config['contract_format'] = format;
        this.config['contract_prefill_data'] = prefillData;
    }


    /**
     * Scan an ID document with Core API, optionally specify document back image, face verification image, face verification video and video passcode
     * @param {string} options.document_primary Front of Document (File path, base64 content or URL)
     * @param {string} options.document_secondary Back of Document (File path, base64 content or URL)
     * @param {string} options.biometric_photo Face Photo (File path, base64 content or URL)
     * @param {string} options.biometric_video Face Video (File path, base64 content or URL)
     * @param {string} options.biometric_video_passcode Face Video Passcode (4 Digit Number)
     * @return {object}
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
        }else if(options.document_primary.length>100){
            payload['file_base64'] = options.document_primary;
        }else{
            throw new Error("Invalid primary document image, file not found or malformed URL.");
        }
        if(options.document_secondary){
            if(isValidURL(options.document_secondary)){
                payload['url_back'] = options.document_secondary;
            }else if(fs.existsSync(options.document_secondary)) {
                payload['file_back_base64'] = fs.readFileSync(options.document_secondary, {encoding: 'base64'});
            }else if(options.document_secondary.length>100){
                payload['file_back_base64'] = options.document_secondary;
            }else {
                throw new Error("Invalid secondary document image, file not found or malformed URL.");
            }
        }
        if(options.biometric_photo){
            if(isValidURL(options.biometric_photo)){
                payload['faceurl'] = options.biometric_photo;
            }else if(fs.existsSync(options.biometric_photo)){
                payload['face_base64'] = fs.readFileSync(options.biometric_photo, {encoding: 'base64'});
            }else if(options.biometric_photo.length>100){
                payload['face_base64'] = options.biometric_photo;
            }else {
                throw new Error("Invalid face image, file not found or malformed URL.");
            }
        }
        if(options.biometric_video){
            if(isValidURL(options.biometric_video)){
                payload['videourl'] = options.biometric_video;
            }else if(fs.existsSync(options.biometric_video)){
                payload['video_base64'] = fs.readFileSync(options.biometric_video, {encoding: 'base64'});
            }else if(options.biometric_video.length>100){
                payload['video_base64'] = options.biometric_video;
            }else {
                throw new Error("Invalid face video, file not found or malformed URL.");
            }
            if(/^([0-9]{4})$/.test(options.biometric_video_passcode) === false){
                throw new Error("Please provide a 4 digit passcode for video biometric verification.");
            }else{
                payload['passcode'] = options.biometric_video_passcode;
            }
        }

        let apiURL = this.apiendpoint;
        return new Promise(function (resolve, reject) {
            axios.post(apiURL, payload, {timeout: 60000, maxContentLength: Infinity, maxBodyLength: Infinity, headers: { 'content-type': 'application/json' }}).then(function (response) {
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
            "vault_save" : true,
            "return_documentimage" : true,
            "return_faceimage" : true,
            "return_type" : 1,
            "crop_document" : false,
            "crop_face" : false,
            "qr_color" : "000000",
            "qr_bgcolor" : "FFFFFF",
            "qr_size" : 5,
            "qr_margin" : 1,
            "welcomemessage" : "",
            "nobranding" : "",
            "logo" : "",
            "language" : "",
            "biometric_threshold" : 0.4,
            "reusable" : false,
            "aml_check": false,
            "aml_strict_match": false,
            "aml_database": "",
            "phoneverification": false,
            "verify_phone": "",
            "sms_verification_link": "",
            "customhtmlurl": "",
            "contract_generate": "",
            "contract_sign": "",
            "contract_format": "",
            "contract_prefill_data": "",
            "sms_contract_link": "",
            "client": client_library
        }
    }


    /**
     * Initialize DocuPass API with an API key, company name and optional region (US, EU)
     * @param {string} apikey You API key
     * @param {string} companyName Your company name
     * @param {string} region US/EU
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
     * Reset all API configurations except API key and region.
     */
    resetConfig()
    {
        this.config = this._defaultConfig();
    }

    /**
     * Check document holder's name and document number against ID Analyzer AML Database for sanctions, crimes and PEPs.
     * @param {boolean} enabled Enable or disable AML/PEP check
     */
    enableAMLCheck(enabled = false)
    {
        this.config["aml_check"] = enabled === true;
    }

    /**
     * Specify the source databases to perform AML check, if left blank, all source databases will be checked. Separate each database code with comma, for example: un_sc,us_ofac. For full list of source databases and corresponding code visit AML API Overview.
     * @param {string} databases Database codes separated by comma
     */
    setAMLDatabase(databases = "au_dfat,ca_dfatd,ch_seco,eu_fsf,fr_tresor_gels_avoir,gb_hmt,ua_sfms,un_sc,us_ofac,eu_cor,eu_meps,global_politicians,interpol_red")
    {
        this.config["aml_database"] = databases;
    }

    /**
     * By default, entities with identical name or document number will be considered a match even though their birthday or nationality may be unknown. Enable this parameter to reduce false-positives by only matching entities with exact same nationality and birthday.
     * @param {boolean} enabled Enable or disable AML strict match mode
     */
    enableAMLStrictMatch(enabled = false)
    {
        this.config["aml_strict_match"] = enabled === true;
    }


    /**
     * Whether to ask user to enter a phone number for verification, DocuPass supports both mobile or landline number verification. Verified phone number will be returned in callback JSON.
     * @param {boolean} enabled Enable or disable user phone verification
     */
    enablePhoneVerification(enabled = false)
    {
        this.config["phoneverification"] = enabled;
    }


    /**
     * DocuPass will send SMS to this number containing DocuPass link to perform identity verification, the number provided will be automatically considered as verified if user completes identity verification. If an invalid or unreachable number is provided error 1050 will be thrown. You should add your own thresholding mechanism to prevent abuse as you will be charged 1 quota to send the SMS.
     * @param {string} mobileNumber Mobile number should be provided in international format such as +1333444555
     */
    smsVerificationLink(mobileNumber = "+1333444555")
    {
        this.config["sms_verification_link"] = mobileNumber;
    }

    /**
     * DocuPass will send SMS to this number containing DocuPass link to review and sign legal document.
     * @param {string} mobileNumber Mobile number should be provided in international format such as +1333444555
     */
    smsContractLink(mobileNumber = "+1333444555")
    {
        this.config["sms_contract_link"] = mobileNumber;
    }

    /**
     * DocuPass will attempt to verify this phone number as part of the identity verification process, both mobile or landline are supported, users will not be able to enter their own numbers or change the provided number.
     * @param {string} phoneNumber Mobile or landline number should be provided in international format such as +1333444555
     */
    verifyPhone(phoneNumber = "+1333444555")
    {
        this.config["verify_phone"] = phoneNumber;
    }


    /**
     * Set max verification attempt per user
     * @param {number} max_attempt 1 to 10
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
     * Set a custom string that will be sent back to your server's callback URL, and appended to redirection URLs as a query string. It is useful for identifying your user within your database. This value will be stored under docupass_customdata under Vault.
     * @param {string} customID A string used to identify your customer internally
     */
    setCustomID(customID = "12345")
    {
        this.config['customid'] = customID;
    }

    /**
     * Display a custom message to the user in the beginning of verification
     * @param {string} message Plain text string
     */
    setWelcomeMessage(message)
    {
        this.config['welcomemessage'] = message;
    }


    /**
     * Replace footer logo with your own logo
     * @param {string} url Logo URL
     */
    setLogo(url = "https://docupass.app/asset/logo1.png")
    {
        this.config['logo'] = url;
    }


    /**
     * Hide all branding logo
     * @param {boolean} hide
     */
    hideBrandingLogo(hide = false)
    {
        this.config['nobranding'] = hide === true;
    }

    /**
     * Replace DocuPass page content with your own HTML and CSS, you can download the HTML/CSS template from DocuPass API Reference page
     * @param {string} url URL pointing to your own HTML page
     */
    setCustomHTML(url)
    {
        this.config['customhtmlurl'] = url;
    }


    /**
     * DocuPass automatically detects user device language and display corresponding language. Set this parameter to override automatic language detection.
     * @param {string} language Check DocuPass API reference for language code
     */
    setLanguage(language)
    {
        this.config['language'] = language;
    }



    /**
     * Set server-side callback/webhook URL to receive verification results
     * @param {string} url Callback URL
     * @throws {Error}
     */
    setCallbackURL(url = "https://www.example.com/docupass_callback.php")
    {
        if(url && !isValidURL(url)) {
            throw new Error("Invalid URL, the host does not appear to be a remote host.");
        }
        this.config['callbackurl'] = url;
    }


    /**
     * Redirect client browser to set URLs after verification. DocuPass reference code and customid will be appended to the end of URL, e.g. https://www.example.com/success.php?reference=XXXXXXXX&customid=XXXXXXXX
     * @param {string} successURL Redirection URL after verification succeeded
     * @param {string} failURL Redirection URL after verification failed
     * @throws {Error}
     */
    setRedirectionURL(successURL = "https://www.example.com/success.php", failURL = "https://www.example.com/failed.php")
    {
        if(successURL && !isValidURL(successURL)) {
            throw new Error("Invalid URL format for success URL");
        }
        if(failURL && !isValidURL(failURL)) {
            throw new Error("Invalid URL format for fail URL");
        }


        this.config['successredir'] = successURL;
        this.config['failredir'] = failURL;
    }


    /**
     * Validate the document to check whether the document is authentic and has not been tampered
     * @param {boolean} enabled Enable or disable  Document Authentication
     * @param {*} module Authentication Module: "1", "2" or "quick"
     * @param {number} minimum_score Minimum score to pass verification
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
            if(enabled && module != "1" && module != "2" && module !== 'quick'){
                throw new Error("Invalid authentication module, 1, 2 or 'quick' accepted.");
            }
            this.config['authenticate_module'] = module;
            this.config['authenticate_minscore'] = minimum_score;
        }
    }



    /**
     * Whether users will be required to submit a selfie photo or record selfie video for facial verification.
     * @param {boolean} enabled Enable or disable Facial Biometric Verification
     * @param {number} verification_type 1 for photo verification, 2 for video verification
     * @param {number} threshold Minimum confidence score required to pass verification, value between 0 to 1
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
     * @param {boolean} reusable Set true to allow unlimited verification for a single DocuPass session
     */
    setReusable(reusable = false)
    {

        this.config['reusable'] = reusable === true;

    }


    /**
     * Enable or disable  returning user uploaded document and face image in callback, and image data format.
     * @param {boolean} return_documentimage Return document image in callback data
     * @param {boolean} return_faceimage Return face image in callback data
     * @param {number} return_type Image type: 0=base64, 1=url
     * @param {boolean} crop_document Crop document in the returned document image
     * @param {boolean} crop_face Crop face in the returned face image
     */
    setCallbackImage(return_documentimage = true, return_faceimage = true, return_type = 1, crop_document = false)
    {

        this.config['return_documentimage'] = return_documentimage === true;
        this.config['return_faceimage'] = return_faceimage === true;
        this.config['return_type'] = return_type === 0? 0:1;
        this.config['crop_document'] = crop_document === true;

    }


    /**
     * Configure QR code generated for DocuPass Mobile and Live Mobile
     * @param {string} foregroundColor Image foreground color HEX code
     * @param {string} backgroundColor Image background color HEX code
     * @param {number} size Image size: 1 to 50
     * @param {number} margin Image margin: 1 to 50
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
     * @param {boolean} enabled Enable or disable dual-side information check
     */
    enableDualsideCheck(enabled = false)
    {
        this.config['dualsidecheck'] = enabled === true;

    }

    /**
     * Check if the document is still valid based on its expiry date.
     * @param {boolean} enabled Enable or disable  expiry check
     */
    verifyExpiry(enabled = false)
    {
        this.config['verify_expiry'] = enabled === true;
    }

    /**
     * Check if supplied document or personal number matches with document.
     * @param {string} documentNumber Document or personal number requiring validation
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
     * @param {string} fullName Full name requiring validation
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
     * @param {string} dob Date of birth in YYYY/MM/DD
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
     * @param {string} ageRange Age range, example: 18-40
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
     * @param {string} address Address requiring validation
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
     * @param {string} postcode Postcode requiring validation
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
     * @param {string} countryCodes ISO ALPHA-2 Country Code separated by comma
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
     * @param {string} states State full name or abbreviation separated by comma
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
     * @param {string} documentType P: Passport, D: Driver's License, I: Identity Card
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
     * @param {boolean} enabled Enable or disable  Vault
     */
    enableVault(enabled = true)
    {
        this.config['vault_save'] = enabled === true;
    }

    /**
     * Set an API parameter and its value, this function allows you to set any API parameter without using the built-in functions
     * @param {string} parameterKey Parameter key
     * @param {string} parameterValue Parameter value
     * @return void
     */
    setParameter(parameterKey, parameterValue)
    {
        this.config[parameterKey] = parameterValue;
    }

    /**
     * Generate legal document using data from user uploaded ID
     * @param {string} templateId Contract Template ID displayed under web portal
     * @param {string} format Output file format: PDF, DOCX or HTML
     * @param {object} prefillData Object or JSON string, to autofill dynamic fields in contract template.
     * @throws {Error}
     */
    generateContract(templateId, format = "PDF", prefillData = {})
    {
        if (!templateId) {
            throw new Error("Invalid template ID");
        }
        this.config['contract_sign'] = "";
        this.config['contract_generate'] = templateId;
        this.config['contract_format'] = format;
        this.config['contract_prefill_data'] = prefillData;
    }

    /**
     * Have user review and sign autofilled legal document after successful identity verification
     * @param {string} templateId Contract Template ID displayed under web portal
     * @param {string} format Output file format: PDF, DOCX or HTML
     * @param {object} prefillData Object or JSON string, to autofill dynamic fields in contract template.
     * @throws {Error}
     */
    signContract(templateId, format = "PDF", prefillData = {})
    {
        if (!templateId) {
            throw new Error("Invalid template ID");
        }
        this.config['contract_generate'] = "";
        this.config['contract_sign'] = templateId;
        this.config['contract_format'] = format;
        this.config['contract_prefill_data'] = prefillData;
    }

    /**
     * Create a DocuPass signature session for user to review and sign legal document without identity verification
     * @param {string} templateId Contract Template ID displayed under web portal
     * @param {string} format Output file format: PDF, DOCX or HTML
     * @param {object} prefillData Object or JSON string, to autofill dynamic fields in contract template.
     * @return {Promise<object>}
     * @throws {Error}
     */
    createSignature(templateId, format = "PDF", prefillData = {}){
        if (!templateId) {
            throw new Error("Invalid template ID");
        }
        let payload = this.config;
        payload["apikey"] = this.apikey;
        payload["template_id"] = templateId;
        payload['contract_format'] = format;
        payload['contract_prefill_data'] = prefillData;

        let apiURL = this.apiendpoint +"docupass/sign";
        return new Promise(function (resolve, reject) {
            axios.post(apiURL, payload, {timeout: 15000, maxContentLength: Infinity, maxBodyLength: Infinity, headers: { 'content-type': 'application/json' }}).then(function (response) {
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
     * Create a DocuPass session for embedding in web page as iframe
     * @return {Promise<object>}
     * @throws {Error}
     */
    createIframe(){
        return this._create(0);
    }

    /**
     * Create a DocuPass session for users to open on mobile phone, or embedding in mobile app
     * @return {Promise<object>}
     * @throws {Error}
     */
    createMobile(){
        return this._create(1);
    }

    /**
     * Create a DocuPass session for users to open in any browser
     * @return {Promise<object>}
     * @throws {Error}
     */
    createRedirection(){
        return this._create(2);
    }

    /**
     * Create a DocuPass Live Mobile verification session for users to open on mobile phone
     * @return {Promise<object>}
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
            axios.post(apiURL, payload, {timeout: 15000, maxContentLength: Infinity, maxBodyLength: Infinity, headers: { 'content-type': 'application/json' }}).then(function (response) {
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
     * @param {string} reference DocuPass reference
     * @param {string} hash DocuPass callback hash
     * @return {Promise<boolean>}
     * @throws {Error}
     */
    validate(reference, hash){

        let payload ={
            apikey: this.apikey,
            reference: reference,
            hash: hash,
            client: client_library
        }

        let apiURL = this.apiendpoint +"docupass/validate";
        return new Promise(function (resolve, reject) {

            axios.post(apiURL, payload, {timeout: 15000, maxContentLength: Infinity, maxBodyLength: Infinity, headers: { 'content-type': 'application/json' }}).then(function (response) {
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
     * @param {string} id Vault entry ID
     * @return {Promise<object>}
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
     * @param {Array} options.filter Array of filter statements, refer to https://developer.idanalyzer.com/vaultapi.html for filter construction
     * @param {string} options.orderby Field name used to order the results, refer to https://developer.idanalyzer.com/vaultapi.html for available fields
     * @param {string} options.sort Sort results by ASC = Ascending, DESC = DESCENDING
     * @param {number} options.limit Number of results to return
     * @param {number} options.offset Offset the first result using specified index
     * @return {Promise<object>}
     * @throws {Error}
     */
    list(options)
    {
        let payload = {}
        if(options.filter){
            if(!Array.isArray(options.filter) || options.filter.length>5){
                throw new Error("Filter must be an array and must not exceed maximum 5 filter strings.");
            }
            payload.filter = options.filter
        }
        if(options.orderby){
            payload.orderby = options.orderby
        }else{
            payload.orderby = "createtime"
        }
        if(options.sort){
            payload.sort = options.sort
        }else{
            payload.sort = "DESC"
        }
        if(options.limit){
            payload.limit = options.limit
        }else{
            payload.limit = 10;
        }
        if(options.offset){
            payload.offset = options.offset
        }else{
            payload.offset = 0;
        }
        return this._callAPI("list", payload);


    }


    /**
     * Update vault entry with new data
     * @param {string} id Vault entry ID
     * @param {object} data Key-value pairs of the field name and its value
     * @return {Promise<object>}
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
     * @return {Promise<object>}
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
     * Add a document or face image into an existing vault entry
     * @param {string} id Vault entry ID
     * @param {string} image Image file path, base64 content or URL
     * @param {number} type Type of image: 0 = document, 1 = person
     * @return {Promise<object>} New image object
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
        }else if(image.length > 100){
            payload['image'] = image;
        }else{
            throw new Error("Invalid image, file not found or malformed URL.");
        }

        return this._callAPI("addimage", payload);

    }


    /**
     * Delete an image from vault
     * @param {string} vaultId Vault entry ID
     * @param {string} imageId Image ID
     * @return {Promise<object>}
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
     * @param {string} image Face image file path, base64 content or URL
     * @param {number} maxEntry Number of entries to return, 1 to 10.
     * @param {number} threshold Minimum confidence score required for face matching
     * @return {Promise<object>} List of vault entries
     * @throws {Error}
     */
    searchFace(image, maxEntry = 10, threshold = 0.5)
    {

        let payload = {maxentry:maxEntry, threshold:threshold};
        if(isValidURL(image)){
            payload['imageurl'] = image;
        }else if(fs.existsSync(image)){
            payload['image'] = fs.readFileSync(image, {encoding: 'base64'});
        }else if(image.length>100){
            payload['image'] = image;
        }else{
            throw new Error("Invalid image, file not found or malformed URL.");
        }

        return this._callAPI("searchface", payload);

    }

    /**
     * Train vault for face search
     * @return {Promise<object>}
     * @throws {Error}
     */
    trainFace()
    {
        return this._callAPI("train");

    }

    /**
     * Get vault training status
     * @return {Promise<object>}
     * @throws {Error}
     */
    trainingStatus()
    {
        return this._callAPI("trainstatus");

    }


    /**
     * Initialize Vault API with an API key, and optional region (US, EU)
     * @param {string} apikey You API key
     * @param {string} region US/EU
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
        payload.client = client_library;
        let apiURL = this.apiendpoint + "vault/" + action;
        return new Promise(function (resolve, reject) {

            axios.post(apiURL , payload, {timeout: 60000, maxContentLength: Infinity, maxBodyLength: Infinity, headers: { 'content-type': 'application/json' }}).then(function (response) {
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

class AMLAPI {

    /**
     * Initialize AML API with an API key, and optional region (US, EU)
     * @param {string} apikey You API key
     * @param {string} region US/EU
     * @throws {Error}
     */
    constructor(apikey, region = "US")
    {
        if(!apikey) throw new Error("Please provide an API key");
        if(!region) throw new Error("Please set an API region (US, EU)");
        this.apikey = apikey;
        this.AMLDatabases = "";
        this.AMLEntityType = "";
        if(region.toUpperCase() === 'EU'){
            this.apiendpoint = "https://api-eu.idanalyzer.com/aml";
        }else if(region.toUpperCase() === "US"){
            this.apiendpoint = "https://api.idanalyzer.com/aml";
        }else{
            this.apiendpoint = region;
        }

    }

    /**
     * Specify the source databases to perform AML search, if left blank, all source databases will be checked. Separate each database code with comma, for example: un_sc,us_ofac. For full list of source databases and corresponding code visit AML API Overview.
     * @param {string} databases Database codes separated by comma
     */
    setAMLDatabase(databases = "au_dfat,ca_dfatd,ch_seco,eu_fsf,fr_tresor_gels_avoir,gb_hmt,ua_sfms,un_sc,us_ofac,eu_cor,eu_meps,global_politicians,interpol_red")
    {
        this.AMLDatabases = databases;
    }

    /**
     * Return only entities with specified entity type, leave blank to return both person and legal entity.
     * @param {string} entityType 'person' or 'legalentity'
     * @throws {Error}
     */
    setEntityType(entityType = "")
    {
        if (entityType!=="person" && entityType!=="legalentity" && entityType!=="")
        {
            throw new Error("Entity Type should be either empty, 'person' or 'legalentity'");
        }
        this.AMLEntityType = entityType;
    }



    /**
     * Search AML Database using a person or company's name or alias
     * @param {string} name Name or alias to search AML Database
     * @param {string} country ISO 2 Country Code
     * @param {string} dob Date of birth in YYYY-MM-DD or YYYY-MM or YYYY format
     * @return {Promise<object>} AML match list
     * @throws {Error}
     */
    searchByName(name = "", country = "", dob = "")
    {

        if (name.length <3)
        {
            throw new Error("Name should contain at least 3 characters.");
        }
        return this._callAPI({
            "name": name,
            "country": country,
            "dob": dob
        });
    }

    /**
     * Search AML Database using a document number (Passport, ID Card or any identification documents)
     * @param {string} documentNumber Document ID Number to perform search
     * @param {string} country ISO 2 Country Code
     * @param {string} dob Date of birth in YYYY-MM-DD or YYYY-MM or YYYY format
     * @return {Promise<object>} AML match list
     * @throws {Error}
     */
    searchByIDNumber(documentNumber = "", country = "", dob = "")
    {

        if (documentNumber.length < 5)
        {
            throw new Error("Document number should contain at least 5 characters.");
        }
        return this._callAPI({
            "documentnumber": documentNumber,
            "country": country,
            "dob": dob
        });

    }




    _callAPI(payload = {}){

        payload.apikey = this.apikey;
        payload.database = this.AMLDatabases;
        payload.entity = this.AMLEntityType;
        payload.client = client_library;

        let apiURL = this.apiendpoint;
        return new Promise(function (resolve, reject) {

            axios.post(apiURL , payload, {timeout: 60000, maxContentLength: Infinity, maxBodyLength: Infinity, headers: { 'content-type': 'application/json' }}).then(function (response) {
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

module.exports = { CoreAPI, DocuPass, Vault, AMLAPI }


