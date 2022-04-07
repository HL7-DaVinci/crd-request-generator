import React, { Component } from 'react';

import DisplayBox from '../components/DisplayBox/DisplayBox';
import ConsoleBox from '../components/ConsoleBox/ConsoleBox';
import '../index.css';
import '../components/ConsoleBox/consoleBox.css';
import config from '../properties.json';
import { KEYUTIL } from 'jsrsasign';
import SettingsBox from '../components/SettingsBox/SettingsBox';
import RequestBox from '../components/RequestBox/RequestBox';
import buildRequest from '../util/buildRequest.js';
import { types, headers, defaultValues } from '../util/data.js';
import { createJwt, login, setupKeys } from '../util/auth';
import {PrefetchTemplate} from '../PrefetchTemplate';

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
            ehrUrl: headers.ehrUrl.value,
            authUrl: headers.authUrl.value,
            cdsUrl: headers.cdsUrl.value,
            orderSelect: headers.orderSelect.value,
            orderSign: headers.orderSign.value,
            showSettings: false,
            ehrLaunch: false,
            patientList: [],
            openPatient: false,
            patient: {},
            deviceRequests: {},
            codeValues: defaultValues,
            currentPatient: null,
            currentDeviceRequest: null,
            baseUrl: null,
            serviceRequests: {},
            currentServiceRequest: null,
            includeConfig: true,
            alternativeTherapy: headers.alternativeTherapy.value
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
        this.requestBox = React.createRef();
    }


    componentDidMount() {
        this.setState({ config });
        let ehr_base = (process.env.REACT_APP_EHR_BASE ? process.env.REACT_APP_EHR_BASE : config.ehr_base);
        let ehr_server = (process.env.REACT_APP_EHR_SERVER ? process.env.REACT_APP_EHR_SERVER : config.ehr_server);
        this.setState({baseUrl: ehr_base ? ehr_base : ehr_server})
        const callback = (keypair) => {
            this.setState({ keypair });
        }

        setupKeys(callback);

        login().then((response) => { return response.json() }).then((token) => {
            this.setState({ token })
        }).catch((error) =>{
            // fails when keycloak isn't running, add dummy token
            this.setState({ token: {access_token: ""}})
        })
    }

    getDeviceRequest(patientId, client) {
        client.request(`DeviceRequest?subject=Patient/${patientId}`,
            {
                resolveReferences: ["subject", "performer"],
                graph: false,
                flat: true
            })
            .then((result) => {
                this.setState(prevState => ({
                    deviceRequests: {
                        ...prevState.deviceRequests,
                        [patientId]: result
                    }
                }));
            });
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
    }

    onInputChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }

    startLoading() {
        this.setState({ loading: true }, () => {
            this.submit_info();
        });

    }

    submit_info(prefetch, request, patient, extraPrefetch, hook) {
        this.consoleLog("Initiating form submission", types.info);
        this.setState({patient});
        const hookConfig = {
            "includeConfig": this.state.includeConfig,
            "alternativeTherapy": this.state.alternativeTherapy
        }
        let json_request = buildRequest(request, patient, this.state.ehrUrl, this.state.token, prefetch, this.state.sendPrefetch, extraPrefetch, hook, hookConfig);
        let cdsUrl = this.state.cdsUrl;
        if (hook === "order-sign") {
            cdsUrl = cdsUrl + "/" + this.state.orderSign;
        } else if (hook === "order-select") {
            cdsUrl = cdsUrl + "/" + this.state.orderSelect;
        } else {
            this.consoleLog("ERROR: unknown hook type", hook);
            return;
        }
        let baseUrl = this.state.baseUrl;
        const jwt = "Bearer " + createJwt(this.state.keypair, baseUrl, cdsUrl);
        console.log(jwt);
        var myHeaders = new Headers({
            "Content-Type": "application/json",
            "authorization": jwt
        });
        this.consoleLog("Fetching response from " + cdsUrl, types.info)
        try {
            fetch(cdsUrl, {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(json_request)
            }).then(response => {
                this.consoleLog("Recieved response", types.info);
                response.json().then((fhirResponse) => {
                    console.log(fhirResponse);
                    if (fhirResponse && fhirResponse.status) {
                        this.consoleLog("Server returned status "
                            + fhirResponse.status + ": "
                            + fhirResponse.error, types.error);
                        this.consoleLog(fhirResponse.message, types.error);
                    } else {
                        this.setState({ response: fhirResponse });
                    }
                    this.setState({ loading: false });
                })
            }).catch(() => this.consoleLog("No response recieved from the server", types.error));
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
            "authUrl": {
                "type": "input",
                "display": "Auth Server",
                "value": this.state.authUrl,
                "key": "authUrl"
            },
            "baseUrl": {
                "type": "input",
                "display": "Base EHR",
                "value": this.state.baseUrl,
                "key": "baseUrl"
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
            },
            "prefetch": {
              "type": "check",
              "display": "Send Prefetch",
              "value": this.state.sendPrefetch,
              "key": "prefetch"
          }
        }

        return (
            <div>
                <div className="nav-header">
                    <button className={"launch-button left-button btn btn-class " + (this.state.ehrLaunch ? "active" : "not-active")} onClick={() => this.updateStateElement("ehrLaunch", true)}>EHR Launch</button>
                    <button className={"launch-button right-button btn btn-class " + (!this.state.ehrLaunch ? "active" : "not-active")} onClick={() => this.updateStateElement("ehrLaunch", false)}>Standalone</button>
                    <button className={"btn btn-class settings " + (this.state.showSettings ? "active" : "not-active")} onClick={() => this.updateStateElement("showSettings", !this.state.showSettings)}><span className="glyphicon glyphicon-cog settings-icon" /></button>

                </div>

                {/* {this.state.ehrLaunch?
                                    <SMARTBox exitSmart={this.exitSmart}>
                                    <EHRLaunchBox></EHRLaunchBox>
                                </SMARTBox>:null} */}
                <div className="form-group container left-form">
                    <div id="settings-header">


                    </div>
                    {this.state.showSettings ?
                        <SettingsBox
                            headers={header}
                            updateCB={this.updateStateElement}
                        /> : null}
                    <div>
                        {/*for the ehr launch */}
                        <RequestBox
                            ehrUrl={this.state.ehrUrl}
                            submitInfo={this.submit_info}
                            access_token={this.state.token}
                            ref={this.requestBox}
                        />

                    </div>
                    <br />
                    {/* <button className={"submit-btn btn btn-class " + (!total ? "button-error" : total === 1 ? "button-ready" : "button-empty-fields")} onClick={this.startLoading}>
                        Submit
                    </button> */}
                    {/* 

                    <CheckBox elementName="oauth" displayName="OAuth" updateCB={this.updateStateElement} />
                    <CheckBox elementName="prefetch" displayName="Include Prefetch" updateCB={this.updateStateElement} />
                    <div id="fse" className={"spinner " + (this.state.loading ? "visible" : "invisible")}>
                        <Loader
                            type="Oval"
                            color="#222222"
                            height="16"
                            width="16"
                        />
                    </div> */}

                    <ConsoleBox logs={this.state.logs} />
                </div>

                <div className="right-form">
                    <DisplayBox
                        response={this.state.response}
                        patientId={this.state.patient.id}
                        ehrLaunch={true}
                        fhirServerUrl={this.state.baseUrl}
                        fhirVersion={'r4'}
                        ehrUrl={this.state.ehrUrl}
                        access_token={this.state.token}
                        takeSuggestion={this.takeSuggestion} />
                </div>

            </div>
        )
    }
}



