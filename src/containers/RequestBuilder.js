import React, { Component } from 'react';

import InputBox from '../components/Inputs/InputBox';
import Toggle from '../components/Inputs/Toggle';
import DisplayBox from '../components/DisplayBox/DisplayBox';
import DropdownInput from '../components/Inputs/DropdownInput';
import DropdownState from '../components/Inputs/DropdownState';
import CheckBox from '../components/Inputs/CheckBox';
import ConsoleBox from '../components/ConsoleBox/ConsoleBox';
import '../index.css';
import '../components/ConsoleBox/consoleBox.css';
import Loader from 'react-loader-spinner';
import config from '../properties.json';
import KJUR, { KEYUTIL } from 'jsrsasign';
import SettingsBox from '../components/SettingsBox/SettingsBox';
import requestR4 from '../util/requestR4.js'
import {types, headers} from '../util/data.js'

export default class RequestBuilder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            age: "",
            gender: null,
            code: null,
            codeSystem: null,
            patientState: null,
            practitionerState: null,
            response: null,
            token: null,
            oauth: false,
            loading: false,
            logs: [],
            keypair: null,
            version: "r4",
            config: {},
            ehrUrl:headers.ehrUrl.value,
            authUrl:headers.authUrl.value,
            cdsUrl:headers.cdsUrl.value,
            showSettings: true
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
        this.setDara = this.setDara.bind(this);
    }


    componentDidMount() {
        this.setState({config});
        this.setState({ keypair: KEYUTIL.generateKeypair('RSA', 2048) });
    }

    setDara() {
        this.setState({
            age: 79,
            gender: "female",
            code: "E0424",
            codeSystem: "https://bluebutton.cms.gov/resources/codesystem/hcpcs",
            patientState: "MA",
            practitionerState: "MA"
        });
    }

    makeid() {
        var text = [];
        var possible = "---ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 25; i++)
            text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

        return text.join('');
    }

    async createJwt() {
        const jwkPrv2 = KEYUTIL.getJWKFromKey(this.state.keypair.prvKeyObj);
        const jwkPub2 = KEYUTIL.getJWKFromKey(this.state.keypair.pubKeyObj);

        const currentTime = KJUR.jws.IntDate.get('now');
        const endTime = KJUR.jws.IntDate.get('now + 1day');
        const kid = KJUR.jws.JWS.getJWKthumbprint(jwkPub2)
        // const pubPem = {"pem":KEYUTIL.getPEM(pubKey),"id":kid};
        const pubPem = { "pem": jwkPub2, "id": kid };

        // Check if the public key is already in the db
        const checkForPublic = await fetch("http://localhost:3001/public_keys?id=" + kid, {
            "headers": {
                "Content-Type": "application/json"
            },
            "method": "GET"
        }).then(response => { return response.json() });
        if (!checkForPublic.length) {
            // POST key to db if it's not already there
            const alag = await fetch("http://localhost:3001/public_keys", {
                "body": JSON.stringify(pubPem),
                "headers": {
                    "Content-Type": "application/json"
                },
                "method": "POST"
            });
        }
        const header = {
            "alg": "RS256",
            "typ": "JWT",
            "kid": kid,
            "jku": "http://localhost:3001/public_keys"
        };
        const body = {
            "iss": "localhost:3000",
            "aud": "r4/order-review-services",
            "iat": currentTime,
            "exp": endTime,
            "jti": this.makeid()
        }

        var sJWT = KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(body), jwkPrv2)

        return sJWT;
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
            [this.state.version]: text
            }
        ))
    }

    onInputChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }

    async login() {

        const tokenUrl = this.state.config.auth + "/realms/" + this.state.config.realm + "/protocol/openid-connect/token"
        this.consoleLog("Retrieving OAuth token from " + tokenUrl, types.info);
        let params = {
            grant_type: "password",
            username: "user1",
            password: "password",
            client_id: this.state.config.client
        }
        if (this.state.config.client) {
            this.consoleLog("Using client {" + this.state.config.client + "}", types.info)
        } else {
            this.consoleLog("No client id provided in properties.json", this.warning);
        }

        // Encodes the params to be compliant with
        // x-www-form-urlencoded content type.
        const searchParams = Object.keys(params).map((key) => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&');
        // We get the token from the url
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: searchParams
        }).then((response) => {
            return response.json();
        }).then(response => {
            console.log(response);
            const token = response ? response.access_token : null;
            if (token) {
                this.consoleLog("Successfully retrieved token", types.info);
            } else {
                this.consoleLog("Failed to get token", types.warning);
                if (response.error_description) {
                    this.consoleLog(response.error_description, types.error);
                }
            }

            this.setState({ token })
            return token;

        }).catch(reason => {
            this.consoleLog("Failed to get token", types.error);
            this.consoleLog("Bad request");
        });

        return tokenResponse;
    }
    startLoading() {
        this.setState({ loading: true }, () => {
            this.submit_info();
        });

    }
    async submit_info() {
        this.consoleLog("Initiating form submission", types.info);

        if (this.state.oauth) {
            const token = await this.login();
        }
        let json_request = this.getJson();
        let jwt = await this.createJwt();
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
            }).catch(reason => this.consoleLog("No response recieved from the server", types.error));

            if (fhirResponse && fhirResponse.status) {
                this.consoleLog("Server returned status "
                    + fhirResponse.status + ": "
                    + fhirResponse.error, types.error);
                this.consoleLog(fhirResponse.message, types.error);
            } else {
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

    render() {
        const options = {
            option1: {
                text: "Male",
                value: "male"
            },
            option2: {
                text: "Female",
                value: "female"
            }
        }
        const validationResult = this.validateState();
        const total = Object.keys(validationResult).reduce((previous, current) => {
            return validationResult[current] * previous
        }, 1);

        return (
            <div>
                <div className="form-group container left-form">
                    <div id = "settings-header">
                        <button className="dara-button btn btn-class" onClick={this.setDara}>Dara</button>
                        <button className={"version-button r4 btn btn-class " + (this.state.version==="r4" ? "active" : "not-active")} onClick={() => this.updateStateElement("version", "r4")}>r4</button>
                        <button className={"version-button stu3 btn btn-class " + (this.state.version==="stu3" ? "active" : "not-active")} onClick={() => this.updateStateElement("version", "stu3")}>stu3</button>
                        <button className={"btn btn-class settings " + (this.state.showSettings?"active":"not-active")} onClick={() => this.updateStateElement("showSettings", !this.state.showSettings)}><span className="glyphicon glyphicon-cog settings-icon" /></button>

                    </div>
                    {this.state.showSettings?
                        <SettingsBox
                            version={this.state.version}
                            headers={headers}
                            updateCB={this.updateVersionedStateElement}
                        />:null}
                        <div>
                            <div className="header">
                                Age
                            </div>
                            <InputBox
                                value={this.state.age}
                                elementName="age"
                                updateCB={this.updateStateElement} />
                            <br />
                        </div>
                        <div>
                            <div className="header">
                                Gender
                            </div>
                                <Toggle
                                    value={this.state.gender}
                                    elementName="gender"
                                    updateCB={this.updateStateElement}
                                    options={options}
                                ></Toggle>
                            <br />
                        </div>
                        <div>
                            <div className="header">
                                Code
                            </div>
                                <DropdownInput
                                    currentValue={this.state.code}
                                    elementName="code"
                                    updateCB={this.updateStateElement}
                                />
                            <br />
                        </div>

                        <div>
                            <div className="leftStateInput">
                                <div className="header">
                                    Patient State
                                </div>
                                <DropdownState
                                    elementName="patientState"
                                    updateCB={this.updateStateElement}
                                    currentValue={this.state.patientState}
                                />
                            </div>
                            <div className="rightStateInput">
                                <div className="header">
                                    Practitioner State
                                </div>
                                <DropdownState
                                    elementName="practitionerState"
                                    updateCB={this.updateStateElement}
                                    currentValue={this.state.practitionerState}
                                />
                            </div>
                        </div>
                        <br />
                    <button className={"submit-btn btn btn-class " + (!total ? "button-error" : total === 1 ? "button-ready" : "button-empty-fields")} onClick={this.startLoading}>Submit
                </button>


                    <CheckBox elementName="oauth" displayName="OAuth" updateCB={this.updateStateElement} />
                    <CheckBox elementName="prefetch" displayName="Include Prefetch" updateCB={this.updateStateElement} />
                    <div id="fse" className={"spinner " + (this.state.loading ? "visible" : "invisible")}>
                        <Loader
                            type="Oval"
                            color="#222222"
                            height="16"
                            width="16"
                        />
                    </div>

                    <ConsoleBox logs={this.state.logs} />
                </div>

                <div className="right-form">
                    <DisplayBox
                        response={this.state.response} />
                </div>

            </div>
        )
    }

    getJson() {
        return requestR4(this.state);
    }
}



