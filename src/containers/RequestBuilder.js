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
import { createJwt, login } from '../util/auth';


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
            prefetch: true,
            loading: false,
            logs: [],
            keypair: null,
            version: "r4",
            config: {},
            ehrUrl: headers.ehrUrl.value,
            authUrl: headers.authUrl.value,
            cdsUrl: headers.cdsUrl.value,
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
            currentServiceRequest: null
        };
        this.validateMap = {
            age: (foo => { return isNaN(foo) }),
            gender: (foo => { return foo !== "male" && foo !== "female" }),
            code: (foo => { return !foo.match(/^[a-z0-9]+$/i) })
        };

        this.updateStateElement = this.updateStateElement.bind(this);
        this.updateVersionedStateElement = this.updateVersionedStateElement.bind(this)
        this.startLoading = this.startLoading.bind(this);
        this.submit_info = this.submit_info.bind(this);
        this.consoleLog = this.consoleLog.bind(this);
        this.exitSmart = this.exitSmart.bind(this);
    }


    componentDidMount() {
        this.setState({ config });
        this.setState({ keypair: KEYUTIL.generateKeypair('RSA', 2048) });

        login().then((response) => { return response.json() }).then((token) => {
            this.setState({ token })
        }).catch((error) =>{
            // fails when keycloak isn't running, add dummy token
            this.setState({ token: {access_token: "-"}})
        })
        // client.request("DeviceRequest/devreq1234", {resolveReferences:["subject","performer"], graph: false}).then((e)=>{console.log(e)})
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

    updateVersionedStateElement = (elementName, text) => {
        this.setState(prevState => ({
            ...prevState,
            [elementName]: {
                ...prevState[elementName],
                [this.state.version]: text
            }
        }
        ))
    }

    onInputChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }

    startLoading() {
        this.setState({ loading: true }, () => {
            this.submit_info();
        });

    }

    getHookType(cdsUrl, fhirVersion) {
        var url = cdsUrl.r4;
        if (fhirVersion === "stu3") {
            url = cdsUrl.stu3;
        }
        if (url.includes("order-review")) {
            return "order-review";
        } else if (url.includes("order-sign")) {
            return "order-sign";
        } else {
            console.log("Could not determine the CDS Hook type, defaulting to order-select.");
            return "order-select";
        }
    }

    async submit_info(prefetch, request, patient) {
        this.consoleLog("Initiating form submission", types.info);
        this.setState({patient});
        
        var hook = this.getHookType(this.state.cdsUrl, this.state.version);
        let json_request = buildRequest(request, patient, this.state.ehrUrl, this.state.token, prefetch, this.state.version, this.state.prefetch, hook);

        // get the base url for the EHR server by stripping the FHIR version off
        let baseUrl = this.state.ehrUrl[this.state.version];
        baseUrl = baseUrl.substr(0, baseUrl.toLowerCase().lastIndexOf(this.state.version.toLowerCase()) - 1);
        this.state.baseUrl = baseUrl;

        let jwt = await createJwt(this.state.keypair.prvKeyObj, this.state.keypair.pubKeyObj, baseUrl);
        jwt = "Bearer " + jwt;
        var myHeaders = new Headers({
            "Content-Type": "application/json",
            "authorization": jwt
        });
        this.consoleLog("Fetching response from " + this.state.cdsUrl[this.state.version], types.info)
        try {
            const fhirResponse = await fetch(this.state.cdsUrl[this.state.version], {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(json_request)
            }).then(response => {
                this.consoleLog("Recieved response", types.info);
                return response.json();
            }).catch(() => this.consoleLog("No response recieved from the server", types.error));

            if (fhirResponse && fhirResponse.status) {
                this.consoleLog("Server returned status "
                    + fhirResponse.status + ": "
                    + fhirResponse.error, types.error);
                this.consoleLog(fhirResponse.message, types.error);
            } else {
                console.log("-----");
                console.log(fhirResponse);
                console.log("----")
                this.setState({ response: fhirResponse });
            }
            this.setState({ loading: false });
        } catch (error) {
            this.setState({ loading: false });
            this.consoleLog("Unexpected error occured", types.error)
            // this.consoleLog(e.,types.error);
            if (error instanceof TypeError) {
                this.consoleLog(error.name + ": " + error.message, types.error);
            }
        }

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
                "display": "EHR Server",
                "value": this.state.ehrUrl,
                "key": "ehrUrl"
            },
            "cdsUrl": {
                "display": "CRD Server",
                "value": this.state.cdsUrl,
                "key": "cdsUrl"
            },
            "authUrl": {
                "display": "Auth Server",
                "value": this.state.authUrl,
                "key": "authUrl"
            }
        }

        return (
            <div>
                <div className="nav-header">
                    <button className={"launch-button left-button btn btn-class " + (this.state.ehrLaunch ? "active" : "not-active")} onClick={() => this.updateStateElement("ehrLaunch", true)}>EHR Launch</button>
                    <button className={"launch-button right-button btn btn-class " + (!this.state.ehrLaunch ? "active" : "not-active")} onClick={() => this.updateStateElement("ehrLaunch", false)}>Standalone</button>
                    <button className={"version-button left-button btn btn-class " + (this.state.version === "r4" ? "active" : "not-active")} onClick={() => this.updateStateElement("version", "r4")}>r4</button>
                    <button className={"version-button right-button btn btn-class " + (this.state.version === "stu3" ? "active" : "not-active")} onClick={() => this.updateStateElement("version", "stu3")}>stu3</button>
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
                            version={this.state.version}
                            headers={header}
                            updateCB={this.updateVersionedStateElement}
                        /> : null}
                    <div>
                        {/*for the ehr launch */}
                        <RequestBox
                            ehrUrl={this.state.ehrUrl[this.state.version]}
                            submitInfo={this.submit_info}
                            access_token={this.state.token}>

                        </RequestBox>

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
                        fhirVersion={this.state.version} />
                </div>

            </div>
        )
    }

    getJson() {
        return buildRequest(this.state);
    }
}



