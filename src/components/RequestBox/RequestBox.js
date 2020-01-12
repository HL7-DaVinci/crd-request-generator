import React, { Component } from 'react';
import FHIR from "fhirclient"
import SMARTBox from '../SMARTBox/SMARTBox';
import PatientBox from '../SMARTBox/PatientBox';
import { defaultValues, shortNameMap } from '../../util/data';
import { getAge } from '../../util/fhir';
import _ from 'lodash';
import './request.css';

export default class RequestBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openPatient: false,
            patientList: [],
            patient: {},
            practitioner: {},
            deviceRequest: {},
            coverage: {},
            deviceRequests: {},
            otherResources: [],
            codeValues: defaultValues,
            patientState: null,
            practitionerState: null,
            code: null,
            codeSystem: null,
            display: null,
            serviceRequests: {},
            serviceRequest: {},
            insurance: {}
        };

        this.renderRequestResources = this.renderRequestResources.bind(this);
        this.addReferencesToList = this.addReferencesToList.bind(this);
        this.checkForReferences = this.checkForReferences.bind(this);
        this.getDeviceRequest = this.getDeviceRequest.bind(this);
        this.getServiceRequest = this.getServiceRequest.bind(this);
        this.renderPatientInfo = this.renderPatientInfo.bind(this);
        this.renderOtherInfo = this.renderOtherInfo.bind(this);
        this.renderResource = this.renderResource.bind(this);
        this.renderPrefetchedResources = this.renderPrefetchedResources.bind(this);
        this.renderError = this.renderError.bind(this);
    }

    componentDidMount() {

    }

    exitSmart = () => {
        this.setState({ openPatient: false })
    }

    submit = () => {
        // make the prefetch
        const resources = [this.state.patient, this.state.practitioner, this.state.deviceRequest, this.state.serviceRequest, this.state.coverage, ...this.state.otherResources];
        const prefetch = resources.reduce((pre, resource) => {
            if (resource.id) {
                pre.push({ resource: resource })
            }
            return pre;
        }, [])

        if (!_.isEmpty(this.state.deviceRequest)) {
            this.props.submitInfo(prefetch, this.state.deviceRequest, this.state.patient);
        } else if (!_.isEmpty(this.state.serviceRequest)) {
            this.props.submitInfo(prefetch, this.state.serviceRequest, this.state.patient);
        }
    }

    updateStateElement = (elementName, text) => {
        this.setState({ [elementName]: text });
    }

    updateStateList = (elementName, text) => {
        this.setState(prevState => ({
            [elementName]: [...prevState[elementName], text]
        }))
    }

    clearState = () => {
        this.setState({
            otherResources: [],
            practitioner: {},
            deviceRequest: {},
            coverage: {},
            serviceRequest: {}
        })
    }

    addReferencesToList(data) {
        Object.keys(data).forEach((refKey) => {
            this.updateStateList("otherResources", data[refKey])
        })
    }

    gatherDeviceRequestResources = deviceRequest => {
        const client = FHIR.client({
            serverUrl: this.props.ehrUrl,
            tokenResponse: {
                access_token: this.props.access_token.access_token
            }
        });

        // If the device request is provided it has the pertinent information.
        // this is for STU3
        // TODO: Update for R4
        client.request(`DeviceRequest/${deviceRequest.id}`,
            {
                resolveReferences: ["performer", "extension.0.valueReference"],
                graph: false,
                flat: true
            })
            .then((result) => {
                const references = result.references;
                Object.keys(references).forEach((refKey) => {
                    const ref = references[refKey];
                    if (ref.resourceType === "Coverage") {
                        client.request(`Coverage/${ref.id}`, {
                            resolveReferences: ["payor"],
                            graph: false,
                            flat: true
                        }).then((result) => {
                            this.addReferencesToList(result.references);
                        })
                        this.setState({ coverage: ref });
                    } else if (ref.resourceType === "Practitioner") {
                        this.setState({ practitioner: ref });
                        // find pracRoles
                        client.request(`PractitionerRole?practitioner=${ref.id}`, {
                            resolveReferences: ["location"],
                            graph: false,
                            flat: true
                        }).then((result) => {
                            // TODO: Better logic here
                            this.addReferencesToList(result.references);
                            this.addReferencesToList(result.data);
                        })
                    }
                })
            });

    }

    gatherServiceRequestResources = serviceRequest => {
        const client = FHIR.client({
            serverUrl: this.props.ehrUrl,
            tokenResponse: {
                access_token: this.props.access_token.access_token
            }
        });

        // If the service request is provided it has the pertinent information.
        // this is for R4
        client.request(`ServiceRequest/${serviceRequest.id}`,
            {
                resolveReferences: ["performer", "insurance.0"],
                graph: false,
                flat: true
            })
            .then((result) => {
                const references = result.references;
                Object.keys(references).forEach((refKey) => {
                    const ref = references[refKey];
                    if (ref.resourceType === "Coverage") {
                        client.request(`Coverage/${ref.id}`, {
                            resolveReferences: ["payor"],
                            graph: false,
                            flat: true
                        }).then((result) => {
                            this.addReferencesToList(result.references);
                        })
                        this.setState({ coverage: ref });
                    } else if (ref.resourceType === "Practitioner") {
                        this.setState({ practitioner: ref });
                        // find pracRoles
                        client.request(`PractitionerRole?practitioner=${ref.id}`, {
                            resolveReferences: ["location"],
                            graph: false,
                            flat: true
                        }).then((result) => {
                            // TODO: Better logic here
                            this.addReferencesToList(result.references);
                            this.addReferencesToList(result.data);
                        })
                    }
                })
            });

    }

    checkForReferences(client, resource, references) {
        client.request(`${resource.resourceType}/${resource.id}`, {
            resolveReferences: references,
            graph: false,
            flat: true
        }).then((result) => {
            console.log(result);
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

    getServiceRequest(patientId, client) {
        client.request(`ServiceRequest?subject=Patient/${patientId}`,
            {
                resolveReferences: ["subject", "performer"],
                graph: false,
                flat: true
            })
            .then((result) => {
                this.setState(prevState => ({
                    serviceRequests: {
                        ...prevState.serviceRequests,
                        [patientId]: result
                    }
                }));
            });
    }

    getPatients = () => {
        console.log(this.props.access_token.access_token);
        this.setState({ openPatient: true });
        const client = FHIR.client({
            serverUrl: this.props.ehrUrl,
            tokenResponse: {
                access_token: this.props.access_token.access_token
            }
        });

        client.request("Patient", { flat: true }).then((result) => {
            this.setState({
                patientList: result
            });
            result.map((e) => {
                this.getDeviceRequest(e.id, client);
                this.getServiceRequest(e.id, client);
            });
        }).catch((e) => {
            this.setState({
                patientList: e
            });
        });
    }

    renderPatientInfo() {
        const patient = this.state.patient;
        let name;
        if (patient.name) {
            name = <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>
        } else {
            name = "N/A"
        }
        return <div className="demographics">
            <div className="lower-border">
                <span style={{ fontWeight: "bold" }}>Demographics</span>
            </div>
            <div className="info lower-border">
                Name: {name}
            </div>
            <div className="info lower-border">
                Age: {patient.birthDate ? getAge(patient.birthDate) : "N/A"}
            </div>
            <div className="info lower-border">
                Gender: {patient.gender ? patient.gender : "N/A"}
            </div>
            <div className="info lower-border">
                State: {this.state.patientState ? this.state.patientState : "N/A"}
            </div>
            {this.renderOtherInfo()}
        </div>
    }

    renderOtherInfo() {
        return <div className="other-info">
            <div className="lower-border">
                <span style={{ fontWeight: "bold" }}>Coding</span>
            </div>
            <div className="info lower-border">
                Code: {this.state.code ? this.state.code : "N/A"}
            </div>
            <div className="info lower-border">
                System: {this.state.codeSystem ? shortNameMap[this.state.codeSystem] : "N/A"}
            </div>
            <div className="info lower-border">
                Display: {this.state.display ? this.state.display : "N/A"}
            </div>
        </div>
    }

    renderPrefetchedResources() {
        const deviceRequestReources = ["patient", "deviceRequest", "coverage", "practitioner"];
        const serviceRequestReources = ["patient", "serviceRequest", "coverage", "practitioner"];
        if (!_.isEmpty(this.state.deviceRequest)) {
            return this.renderRequestResources(deviceRequestReources)
        } else if (!_.isEmpty(this.state.serviceRequest)) {
            return this.renderRequestResources(serviceRequestReources);
        }
    }

    renderRequestResources(requestReources) {
        return (<div className="prefetched">
            <div className="prefetch-header">
                Prefetched
        </div>
            {requestReources.map((resource) => {
                return this.renderResource(resource)
            })}
            <div className="prefetch-header">
                Other Resources
        </div>
            {this.state.otherResources.map((resource) => {
                return this.renderOtherResources(resource)
            })}
        </div>);
    }

    renderResource(resourceType) {
        let value = <div>N/A</div>
        if (this.state[resourceType].id) {
            value = <div key={this.state[resourceType].id}>
                <span style={{ textTransform: "capitalize" }}>{resourceType}</span>: {this.state[resourceType].resourceType}/{this.state[resourceType].id} .....<span className="checkmark glyphicon glyphicon-ok"></span>
            </div>
        } else {
            value = <div key={resourceType}>
                <span style={{ textTransform: "capitalize" }}>{resourceType}</span> .....<span className="remove glyphicon glyphicon-remove"></span>
            </div>
        }
        return value
    }

    renderOtherResources(resource, name) {
        let value = <div>N/A</div>
        if (resource.id) {
            value = <div key={resource.id}>
                {resource.resourceType}/{resource.id} .....<span className="checkmark glyphicon glyphicon-ok"></span>
            </div>
        } else {
            value = <div key={name}>
                <span style={{ textTransform: "capitalize" }}>{name}</span> .....<span className="remove glyphicon glyphicon-remove"></span>
            </div>
        }
        return value
    }

    renderError() {
        return <span className="patient-error">{this.state.patientList.message}</span>
    }

    render() {
        return (
            <div>
                <div className="request">
                    {this.state.openPatient ? <div>
                        <SMARTBox exitSmart={this.exitSmart}>
                            <div className="patient-box">
                                {this.state.patientList instanceof Error ? this.renderError() : this.state.patientList.map((patient) => {
                                    return <PatientBox
                                        key={patient.id}
                                        patient={patient}
                                        deviceRequests={this.state.deviceRequests[patient.id]}
                                        serviceRequests={this.state.serviceRequests[patient.id]}
                                        callback={this.updateStateElement}
                                        updateDeviceRequestCallback={this.gatherDeviceRequestResources}
                                        updateServiceRequestCallback={this.gatherServiceRequestResources}
                                        clearCallback={this.clearState}
                                        ehrUrl={this.props.ehrUrl}
                                        options={this.state.codeValues}
                                    />
                                })}
                            </div>


                        </SMARTBox>
                    </div> : ""}

                    <div>
                        <button className="select-button" onClick={this.getPatients}>Patient Select:</button>
                        <div className="request-header">{this.state.patient.id ? this.state.patient.id : "N/A"}</div>
                        <div>
                            {this.renderPatientInfo()}
                            {this.renderPrefetchedResources()}
                        </div>

                    </div>

                </div>
                <button className={"submit-btn btn btn-class "} onClick={this.submit}>
                    Submit
                </button>
            </div>

        )
    }
}