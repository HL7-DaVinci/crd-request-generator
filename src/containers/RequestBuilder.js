import React, { Component } from 'react';
import { Box, Button, Alert, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import DisplayBox from '../components/DisplayBox/DisplayBox';
import ConsoleBox from '../components/ConsoleBox/ConsoleBox';
import '../index.css';
import '../components/ConsoleBox/consoleBox.css';
import config from '../config.js';
import { KEYUTIL } from 'jsrsasign';
import SettingsBox from '../components/SettingsBox/SettingsBox';
import RequestBox from '../components/RequestBox/RequestBox';
import buildRequest from '../util/buildRequest.js';
import { types, headers, defaultValues, getConfigValue } from '../util/data.js';
import { createJwt, login, setupKeys, exchangeCodeForToken, checkOAuthCallbackError } from '../util/auth';
import axios from 'axios';

export default class RequestBuilder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            age: "",
            gender: null,
            code: null,
            codeSystem: null,
            response: null,
            token: null,
            oauth: false,
            sendPrefetch: true,
            loading: false,
            logs: [],
            keypair: null,
            config: {},
            ehrUrl: null,
            cdsUrl: null,
            orderSelect: null,
            orderSign: null,
            showSettings: false,
            ehrLaunch: false,
            patientList: [],
            openPatient: false,
            patient: {},
            codeValues: defaultValues,
            currentPatient: null,
            serviceRequests: {},
            currentServiceRequest: null,
            includeConfig: true,
            alternativeTherapy: null,
            launchUrl: null,
            responseExpirationDays: headers.responseExpirationDays.value,
            publicKeys: null,
            client: null,
            hasUnsavedChanges: false
        };
        this.validateMap = {
            age: (foo => { return isNaN(foo) }),
            gender: (foo => { return foo !== "male" && foo !== "female" }),
            code: (foo => { return !foo.match(/^[a-z0-9]+$/i) })
        };
        this.updateStateElement = this.updateStateElement.bind(this);
        this.startLoading = this.startLoading.bind(this);
        this.submit_info = this.submit_info.bind(this);
        this.consoleLog = this.consoleLog.bind(this);
        this.exitSmart = this.exitSmart.bind(this);
        this.takeSuggestion = this.takeSuggestion.bind(this);
        this.saveConfigurationChanges = this.saveConfigurationChanges.bind(this);
        this.resetConfigurationToDefaults = this.resetConfigurationToDefaults.bind(this);
        this.requestBox = React.createRef();
    }
      async componentDidMount() {
        this.setState({ config });
        
        // Refresh configuration values from localStorage, environment, and config file
        this.refreshConfigFromSources();
        
        let banner = (process.env.REACT_APP_BANNER ? process.env.REACT_APP_BANNER : config.banner);
        this.setState({banner: banner});
        
        const callback = (keypair) => {
            this.setState({ keypair });
        }

        setupKeys(callback);
        
        // Check if this is an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        // Check for OAuth errors first
        const oauthError = checkOAuthCallbackError(urlParams);
        if (oauthError) {
            // Handle OAuth error
            console.error('OAuth authorization error:', oauthError);
            this.consoleLog(`OAuth Error: ${oauthError.error} - ${oauthError.description}`, types.error);
            this.setState({ token: {access_token: ""}});
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
        
        if (code && state) {
            // Handle successful OAuth callback
            try {
                const response = await exchangeCodeForToken(code, state);
                const token = await response.json();
                this.setState({ token });
                this.consoleLog("OAuth authentication successful", types.info);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('OAuth callback error:', error);
                this.consoleLog(`OAuth token exchange failed: ${error.message}`, types.error);
                this.setState({ token: {access_token: ""}});
            }
        } else {
            // Normal login flow
            try {
                const response = await login();
                const token = await response.json();
                this.setState({ token });
            } catch (error) {
                // fails when auth server isn't running or auth fails, add dummy token
                this.setState({ token: {access_token: ""}});
            }
        }
    }

    consoleLog(content, type) {
        console.log(content);
        let jsonContent = {
            content: content,
            type: type
        }
        this.setState(prevState => ({
            logs: [...prevState.logs, jsonContent]
        }))
    }
    updateStateElement = (elementName, text) => {
        this.setState({ [elementName]: text });
        // Mark that there are unsaved configuration changes
        const configKeys = ['ehrUrl', 'cdsUrl', 'orderSelect', 'orderSign', 'launchUrl', 'responseExpirationDays', 'alternativeTherapy', 'publicKeys', 'client'];
        if (configKeys.includes(elementName)) {
            this.setState({ hasUnsavedChanges: true });
        }
    }
    
    // Refresh configuration values from localStorage, environment, and config file
    refreshConfigFromSources = () => {
        this.setState({
            ehrUrl: getConfigValue('ehrUrl', 'REACT_APP_EHR_SERVER', 'ehr_server'),
            cdsUrl: getConfigValue('cdsUrl', 'REACT_APP_CDS_SERVICE', 'cds_service'),
            orderSelect: getConfigValue('orderSelect', 'REACT_APP_ORDER_SELECT', 'order_select'),
            orderSign: getConfigValue('orderSign', 'REACT_APP_ORDER_SIGN', 'order_sign'),
            launchUrl: getConfigValue('launchUrl', 'REACT_APP_LAUNCH_URL', 'launch_url'),
            responseExpirationDays: getConfigValue('responseExpirationDays', 'REACT_APP_FORM_EXPIRATION_DAYS', 'response_expiration_days'),
            alternativeTherapy: getConfigValue('alternativeTherapy', 'REACT_APP_ALTERNATIVE_THERAPY', 'alt_drug'),
            publicKeys: getConfigValue('publicKeys', 'REACT_APP_PUBLIC_KEYS', 'public_keys'),            client: getConfigValue('client', 'REACT_APP_CLIENT', 'client')
        });
    }

    // Save configuration values to localStorage and refresh the page
    saveConfigurationChanges = () => {
        var configKeys = ['ehrUrl', 'cdsUrl', 'orderSelect', 'orderSign', 'launchUrl', 'responseExpirationDays', 'alternativeTherapy', 'publicKeys', 'client'];
        
        // Save current state values to localStorage
        configKeys.forEach(key => {
            if (this.state[key] !== null && this.state[key] !== undefined) {
                localStorage.setItem(key, this.state[key]);
            }
        });
        
        // Clear unsaved changes flag and refresh the page
        this.setState({ hasUnsavedChanges: false }, () => {
            // Refresh the page to reload configuration from all sources
            window.location.reload();
        });    }

    // Clear all configuration from localStorage and refresh the page
    resetConfigurationToDefaults = () => {
        const configKeys = ['ehrUrl', 'cdsUrl', 'orderSelect', 'orderSign', 'launchUrl', 'responseExpirationDays', 'alternativeTherapy', 'publicKeys', 'client'];
        
        // Remove all configuration values from localStorage
        configKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Refresh the page to reload configuration from environment/config file
        window.location.reload();
    }

    onInputChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }

    startLoading() {
        this.setState({ loading: true }, () => {
            this.submit_info();
        });

    }

    async submit_info(prefetch, request, patient, hook, deidentifyRecords, setResponseState) {
        this.consoleLog("Initiating form submission", types.info);
        this.setState({patient});
        const hookConfig = {
            "includeConfig": this.state.includeConfig,
            "alternativeTherapy": this.state.alternativeTherapy
        }
        let json_request = buildRequest(request, patient, this.state.ehrUrl, this.state.token, prefetch, this.state.sendPrefetch, hook, hookConfig, deidentifyRecords);
        let cdsUrl = this.state.cdsUrl;
        if (hook === "order-sign") {
            cdsUrl = cdsUrl + "/" + this.state.orderSign;
        } else if (hook === "order-select") {
            cdsUrl = cdsUrl + "/" + this.state.orderSelect;
        } else {
            this.consoleLog("ERROR: unknown hook type: '", hook, "'");
            return;
        }
        let ehrUrl = this.state.ehrUrl;
        const jwt = this.state.keypair ? "Bearer " + createJwt(this.state.keypair, ehrUrl, cdsUrl) : null;
        console.log(jwt);
        var myHeaders = new Headers({
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": jwt
        });
        this.consoleLog("Fetching response from " + cdsUrl, types.info);
        try {
            try {
                let response = await fetch(cdsUrl, {
                    method: "POST",
                    headers: myHeaders,
                    body: JSON.stringify(json_request)
                });
                let fhirResponse = await response.json();
                
                if (fhirResponse && fhirResponse.status) {
                    this.consoleLog("Server returned status "
                        + fhirResponse.status + ": "
                        + fhirResponse.error, types.error);
                    this.consoleLog(fhirResponse.message, types.error);
                } else {
                    if (setResponseState) {
                        this.setState({ response: fhirResponse });
                    }
                    return fhirResponse;
                }
            } catch (error) {
                this.consoleLog("No response recieved from the server", types.error);
            } finally {
                this.setState({ loading: false });
            }

        } catch (error) {
            this.setState({ loading: false });
            this.consoleLog("Unexpected error occured", types.error)
            // this.consoleLog(e.,types.error);
            if (error instanceof TypeError) {
                this.consoleLog(error.name + ": " + error.message, types.error);
            }
        }

    }

    takeSuggestion(resource) {
        // when a suggestion is taken, call into the requestBox to resubmit the CRD request with the new request
        this.requestBox.current.replaceRequestAndSubmit(resource);
    }

    validateState() {
        const validationResult = {};
        Object.keys(this.validateMap).forEach(key => {
            if (this.state[key] && this.validateMap[key](this.state[key])) {
                // Basically we want to know if we have any errors
                // or empty fields, and we want the errors to override
                // the empty fields, so we make errors 0 and unpopulated
                // fields 2.  Then we just look at whether the product of all
                // the validations is 0 (error), 1 (valid) , or >1 (some unpopulated fields).
                validationResult[key] = 0;
            } else if (this.state[key]) {
                // the field is populated and valid
                validationResult[key] = 1;
            } else {
                // the field is not populated
                validationResult[key] = 2
            }
        });

        return validationResult;
    }

    exitSmart() {
        this.setState({ openPatient: false })
    }

     /**
 * Retrieves a SMART launch context from an endpoint to append as a "launch" query parameter to a SMART app launch URL (see SMART docs for more about launch context).
 * This applies mainly if a SMART app link on a card is to be launched. The link needs a "launch" query param with some opaque value from the SMART server entity.
 * This function generates the launch context (for HSPC Sandboxes only) for a SMART application by pinging a specific endpoint on the FHIR base URL and returns
 * a Promise to resolve the newly modified link.
 * @param {*} link - The SMART app launch URL
 * @param {*} accessToken - The access token provided to the CDS Hooks Sandbox by the FHIR server
 * @param {*} patientId - The identifier of the patient in context
 * @param {*} fhirBaseUrl - The base URL of the FHIR server in context
 */
retrieveLaunchContext(link, accessToken, patientId, fhirBaseUrl, fhirVersion) {
    return new Promise((resolve, reject) => {
      const headers = accessToken ?
      {
        "Accept": 'application/json',
        "Authorization": `Bearer ${accessToken.access_token}`
      }
      :
      {        
        "Accept": 'application/json'
      };
      const launchParameters = {
        patient: patientId,
      };
  
      if (link.appContext) {
        launchParameters.appContext = link.appContext;
      }
  
      // May change when the launch context creation endpoint becomes a standard endpoint for all EHR providers
      axios({
        method: 'post',
        url: `${fhirBaseUrl}/_services/smart/Launch`,
        headers,
        data: {
          launchUrl: link.url,
          parameters: launchParameters,
        },
      }).then((result) => {
        if (result.data && Object.prototype.hasOwnProperty.call(result.data, 'launch_id')) {
          if (link.url.indexOf('?') < 0) {
            link.url += '?';
          } else {
            link.url += '&';
          }
          link.url += `launch=${result.data.launch_id}`;
          link.url += `&iss=${fhirBaseUrl}`;
          return resolve(link);
        }
        console.error('FHIR server endpoint did not return a launch_id to launch the SMART app. See network calls to the Launch endpoint for more details');
        link.error = true;
        return reject(link);
      }).catch((err) => {
        console.error('Cannot grab launch context from the FHIR server endpoint to launch the SMART app. See network calls to the Launch endpoint for more details', err);
        link.error = true;
        return reject(link);
      });
    });
  }

    render() {
        const header =
        {
            "ehrUrl": {
                "type": "input",
                "display": "EHR Server",
                "value": this.state.ehrUrl,
                "key": "ehrUrl"
            },
            "cdsUrl": {
                "type": "input",
                "display": "CRD Server",
                "value": this.state.cdsUrl,
                "key": "cdsUrl"
            },
            "orderSelect": {
                "type": "input",
                "display": "Order Select Rest End Point",
                "value": this.state.orderSelect,
                "key": "orderSelect"
            },
            "orderSign": {
                "type": "input",
                "display": "Order Sign Rest End Point",
                "value": this.state.orderSign,
                "key": "orderSign"
            },
            "launchUrl": {
                "type": "input",
                "display": "DTR Launch URL",
                "value": this.state.launchUrl,
                "key": "launchUrl"
            },
            "responseExpirationDays": {
                "type": "input",
                "display": "In Progress Form Expiration Days",
                "value": this.state.responseExpirationDays,
                "key": "responseExpirationDays"
            },
            "publicKeys": {
                "type": "input",
                "display": "Public Keys URL",
                "value": this.state.publicKeys,
                "key": "publicKeys"
            },
            "client": {
                "type": "input",
                "display": "Client ID",
                "value": this.state.client,
                "key": "client"
            },
            "includeConfig": {
                "type": "check",
                "display": "Include Configuration in CRD Request",
                "value": this.state.includeConfig,
                "key": "includeConfig"
            },
            "alternativeTherapy": {
                "type": "check",
                "display": "Alternative Therapy Cards Allowed",
                "value": this.state.alternativeTherapy,
                "key": "alternativeTherapy"
            },            "sendPrefetch": {
              "type": "check",
              "display": "Send Prefetch",
              "value": this.state.sendPrefetch,
              "key": "sendPrefetch"
          }
        };

        return (
            <Box>
                <Box className="nav-header" sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: '#005B94' }}>
                    <Button 
                        variant={this.state.ehrLaunch ? "contained" : "outlined"}
                        onClick={() => this.updateStateElement("ehrLaunch", true)}
                        sx={{ 
                            mr: 1,
                            color: this.state.ehrLaunch ? 'white' : 'white',
                            borderColor: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        EHR Launch
                    </Button>
                    <Button 
                        variant={!this.state.ehrLaunch ? "contained" : "outlined"}
                        onClick={() => this.updateStateElement("ehrLaunch", false)}
                        sx={{ 
                            mr: 'auto',
                            color: !this.state.ehrLaunch ? 'white' : 'white',
                            borderColor: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        Standalone
                    </Button>
                    <Button 
                        variant={this.state.showSettings ? "contained" : "outlined"}
                        onClick={() => this.updateStateElement("showSettings", !this.state.showSettings)}
                        sx={{ 
                            minWidth: 'auto',
                            color: 'white',
                            borderColor: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <SettingsIcon />
                    </Button>
                </Box>

                {this.state.banner && (
                    <Alert severity="info" sx={{ m: 2 }}>
                        <span dangerouslySetInnerHTML={{__html: this.state.banner}}></span>
                    </Alert>
                )}

                <Box className="form-group container left-form" sx={{ width: '50%', float: 'left', mt: 3, pl: 2 }}>
                    <Box id="settings-header" sx={{ mb: 2 }}>
                    </Box>
                    {this.state.showSettings && (
                        <>
                            <SettingsBox
                                headers={header}
                                updateCB={this.updateStateElement}
                            />
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    onClick={this.saveConfigurationChanges}
                                    disabled={!this.state.hasUnsavedChanges}
                                    sx={{ mr: 2 }}
                                >
                                    Save Configuration
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="secondary"
                                    onClick={this.resetConfigurationToDefaults}
                                    sx={{ mr: 2 }}
                                >
                                    Reset to Defaults
                                </Button>
                                {this.state.hasUnsavedChanges && (
                                    <Typography variant="body2" color="warning.main" component="span">
                                        You have unsaved changes
                                    </Typography>
                                )}
                            </Box>
                        </>
                    )}
                    <Box>
                        <RequestBox
                            ehrUrl={this.state.ehrUrl}
                            submitInfo={this.submit_info}
                            access_token={this.state.token}
                            fhirServerUrl={this.state.ehrUrl}
                            fhirVersion={'r4'}
                            patientId={this.state.patient.id}
                            retrieveLaunchContext={this.retrieveLaunchContext}
                            launchUrl={this.state.launchUrl}
                            responseExpirationDays={this.state.responseExpirationDays}
                            ref={this.requestBox}
                        />
                    </Box>                    <ConsoleBox logs={this.state.logs} />
                </Box>

                <Box className="right-form" sx={{ float: 'right', width: '50%', mt: 6, pr: 2 }}>
                    <DisplayBox
                        response={this.state.response}
                        patientId={this.state.patient.id}
                        ehrLaunch={true}
                        fhirServerUrl={this.state.ehrUrl}
                        fhirVersion={'r4'}
                        ehrUrl={this.state.ehrUrl}
                        access_token={this.state.token}
                        takeSuggestion={this.takeSuggestion}
                        retrieveLaunchContext={this.retrieveLaunchContext} />
                </Box>

            </Box>
        )
    }
}



