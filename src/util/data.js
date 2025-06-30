import config from '../config.js';

// Helper function to resolve configuration values with priority:
// 1. localStorage
// 2. environment variable
// 3. config file
function getConfigValue(localStorageKey, envVarName, configProperty) {
    // First check localStorage
    const localStorageValue = localStorage.getItem(localStorageKey);
    if (localStorageValue !== null && localStorageValue !== '') {
        return localStorageValue;
    }
    
    // Then check environment variable
    const envValue = process.env[envVarName];
    if (envValue) {
        return envValue;
    }
    
    // Finally fallback to config file
    return config[configProperty];
}

// Helper function to get the source of a configuration value for debugging
function getConfigSource(localStorageKey, envVarName, configProperty) {
    // First check localStorage
    const localStorageValue = localStorage.getItem(localStorageKey);
    if (localStorageValue !== null && localStorageValue !== '') {
        return 'localStorage';
    }
    
    // Then check environment variable
    const envValue = process.env[envVarName];
    if (envValue) {
        return 'environment';
    }
    
    // Finally fallback to config file
    return 'config file';
}

// Helper function to clear all configuration values from localStorage
function clearConfigFromLocalStorage() {
    const configKeys = ['ehrUrl', 'cdsUrl', 'orderSelect', 'orderSign', 'launchUrl', 'responseExpirationDays', 'alternativeTherapy', 'publicKeys', 'client'];
    configKeys.forEach(key => {
        localStorage.removeItem(key);
    });
}

// Helper function to get all configuration sources for debugging
function getAllConfigSources() {    const configMappings = [
        { key: 'ehrUrl', env: 'REACT_APP_EHR_SERVER', config: 'ehr_server', display: 'EHR Server' },
        { key: 'cdsUrl', env: 'REACT_APP_CDS_SERVICE', config: 'cds_service', display: 'CRD Server' },
        { key: 'orderSelect', env: 'REACT_APP_ORDER_SELECT', config: 'order_select', display: 'Order Select' },
        { key: 'orderSign', env: 'REACT_APP_ORDER_SIGN', config: 'order_sign', display: 'Order Sign' },
        { key: 'launchUrl', env: 'REACT_APP_LAUNCH_URL', config: 'launch_url', display: 'Launch URL' },
        { key: 'responseExpirationDays', env: 'REACT_APP_FORM_EXPIRATION_DAYS', config: 'response_expiration_days', display: 'Form Expiration Days' },
        { key: 'alternativeTherapy', env: 'REACT_APP_ALTERNATIVE_THERAPY', config: 'alt_drug', display: 'Alternative Therapy' },
        { key: 'publicKeys', env: 'REACT_APP_PUBLIC_KEYS', config: 'public_keys', display: 'Public Keys URL' },
        { key: 'client', env: 'REACT_APP_CLIENT', config: 'client', display: 'Client ID' }
    ];
    
    return configMappings.map(mapping => {
        return {
            key: mapping.key,
            env: mapping.env,
            config: mapping.config,
            display: mapping.display,
            value: getConfigValue(mapping.key, mapping.env, mapping.config),
            source: getConfigSource(mapping.key, mapping.env, mapping.config)
        };
    });
}

const types = {
    error: "errorClass",
    info: "infoClass",
    debug: "debugClass",
    warning: "warningClass"
}

const headers = {
    "ehrUrl": {
        "display": "EHR Server",
        "value": getConfigValue('ehrUrl', 'REACT_APP_EHR_SERVER', 'ehr_server'),
        "key": "ehrUrl"
    },
    "cdsUrl": {
        "display": "CRD Server",
        "value": getConfigValue('cdsUrl', 'REACT_APP_CDS_SERVICE', 'cds_service'),
        "key":"cdsUrl"
    },
    "orderSelect": {
        "display": "Order Select Rest End Point",
        "value": getConfigValue('orderSelect', 'REACT_APP_ORDER_SELECT', 'order_select'),
        "key":"orderSelect"
    },
    "orderSign": {
        "display": "Order Sign Rest End Point",
        "value": getConfigValue('orderSign', 'REACT_APP_ORDER_SIGN', 'order_sign'),
        "key":"orderSign"    },
    "alternativeTherapy": {
        "display": "Alternative Therapy Cards Allowed",
        "value": getConfigValue('alternativeTherapy', 'REACT_APP_ALTERNATIVE_THERAPY', 'alt_drug'),
        "key": "alternativeTherapy"
    },
    "launchUrl" : {
        "display": "DTR Launch URL",
    "value": getConfigValue('launchUrl', 'REACT_APP_LAUNCH_URL', 'launch_url'),
        "key": "launchUrl"
    },    "responseExpirationDays" : {
        "display": "In Progress Form Expiration Days",
        "value": getConfigValue('responseExpirationDays', 'REACT_APP_FORM_EXPIRATION_DAYS', 'response_expiration_days'),
        "key": "responseExpirationDays"
    },
    "publicKeys": {
        "display": "Public Keys URL",
        "value": getConfigValue('publicKeys', 'REACT_APP_PUBLIC_KEYS', 'public_keys'),
        "key": "publicKeys"
    },
    "client": {
        "display": "Client ID",
        "value": getConfigValue('client', 'REACT_APP_CLIENT', 'client'),
        "key": "client"
    }
}

const genderOptions = {
    option1: {
        text: "Male",
        value: "male"
    },
    option2: {
        text: "Female",
        value: "female"
    }
}

const stateOptions = [
    { key: 'AL', value: 'AL', text: 'Alabama' },
    { key: 'AK', value: 'AK', text: 'Alaska' },
    { key: 'AZ', value: 'AZ', text: 'Arizona' },
    { key: 'AR', value: 'AR', text: 'Arkansas' },
    { key: 'CA', value: 'CA', text: 'California' },
    { key: 'CO', value: 'CO', text: 'Colorado' },
    { key: 'CT', value: 'CT', text: 'Connecticut' },
    { key: 'DE', value: 'DE', text: 'Delaware' },
    { key: 'DC', value: 'DC', text: 'District Of Columbia' },
    { key: 'FL', value: 'FL', text: 'Florida' },
    { key: 'GA', value: 'GA', text: 'Georgia' },
    { key: 'HI', value: 'HI', text: 'Hawaii' },
    { key: 'ID', value: 'ID', text: 'Idaho' },
    { key: 'IL', value: 'IL', text: 'Illinois' },
    { key: 'IN', value: 'IN', text: 'Indiana' },
    { key: 'IA', value: 'IA', text: 'Iowa' },
    { key: 'KS', value: 'KS', text: 'Kansas' },
    { key: 'KY', value: 'KY', text: 'Kentucky' },
    { key: 'LA', value: 'LA', text: 'Louisiana' },
    { key: 'ME', value: 'ME', text: 'Maine' },
    { key: 'MD', value: 'MD', text: 'Maryland' },
    { key: 'MA', value: 'MA', text: 'Massachusetts' },
    { key: 'MI', value: 'MI', text: 'Michigan' },
    { key: 'MN', value: 'MN', text: 'Minnesota' },
    { key: 'MS', value: 'MS', text: 'Mississippi' },
    { key: 'MO', value: 'MO', text: 'Missouri' },
    { key: 'MT', value: 'MT', text: 'Montana' },
    { key: 'NE', value: 'NE', text: 'Nebraska' },
    { key: 'NV', value: 'NV', text: 'Nevada' },
    { key: 'NH', value: 'NH', text: 'New Hampshire' },
    { key: 'NJ', value: 'NJ', text: 'New Jersey' },
    { key: 'NM', value: 'NM', text: 'New Mexico' },
    { key: 'NY', value: 'NY', text: 'New York' },
    { key: 'NC', value: 'NC', text: 'North Carolina' },
    { key: 'ND', value: 'ND', text: 'North Dakota' },
    { key: 'OH', value: 'OH', text: 'Ohio' },
    { key: 'OK', value: 'OK', text: 'Oklahoma' },
    { key: 'OR', value: 'OR', text: 'Oregon' },
    { key: 'PA', value: 'PA', text: 'Pennsylvania' },
    { key: 'RI', value: 'RI', text: 'Rhode Island' },
    { key: 'SC', value: 'SC', text: 'South Carolina' },
    { key: 'SD', value: 'SD', text: 'South Dakota' },
    { key: 'TN', value: 'TN', text: 'Tennessee' },
    { key: 'TX', value: 'TX', text: 'Texas' },
    { key: 'UT', value: 'UT', text: 'Utah' },
    { key: 'VT', value: 'VT', text: 'Vermont' },
    { key: 'VA', value: 'VA', text: 'Virginia' },
    { key: 'WA', value: 'WA', text: 'Washington' },
    { key: 'WV', value: 'WV', text: 'West Virginia' },
    { key: 'WI', value: 'WI', text: 'Wisconsin' },
    { key: 'WY', value: 'WY', text: 'Wyoming' },
  ]

  const defaultValues = [
    { key: 'CPAP', text: 'E0601', value: 'E0601', codeSystem: 'https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets' },
    { key: 'Wheelchair', text: '97542', value: '97542', codeSystem: 'http://www.ama-assn.org/go/cpt' },
    { key: 'Crutches', text: 'E0110', value: 'E0110', codeSystem: 'https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets' },
    { key: 'Hospital Bed', text: 'E0250', value: 'E0250', codeSystem: 'https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets' },
    { key: 'Continuous Glucose Monitoring', text: '95250', value: '95250', codeSystem: 'http://www.ama-assn.org/go/cpt' },
    { key: 'Nebulizer', text: '94640', value:'94640', codeSystem: 'http://www.ama-assn.org/go/cpt' },
    { key: 'Glucose Test Strip', text:'82947', value:'82947', codeSystem: 'http://www.ama-assn.org/go/cpt'},
    { key: 'Oxygen Therapy', text: 'E0424', value:'E0424', codeSystem:'https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets' }
]

const shortNameMap = {
    "http://www.ama-assn.org/go/cpt":"CPT",
    "https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets": "HCPCS",
    "http://www.nlm.nih.gov/research/umls/rxnorm": "RxNorm",
    "http://hl7.org/fhir/sid/ndc": "NDC"
}

export {
    clearConfigFromLocalStorage,
    defaultValues,
    genderOptions,
    getConfigValue,
    getConfigSource,
    headers,
    shortNameMap,
    stateOptions,
    types,
    getAllConfigSources
}