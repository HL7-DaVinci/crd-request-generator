import React, { Component } from 'react';
import { getAge } from '../../util/fhir';
import './smart.css';
export default class SMARTBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deviceRequest: "none",
            serviceRequest: "none",
            medicationRequest: "none"
        };

        this.handleDeviceRequestChange = this.handleDeviceRequestChange.bind(this);
        this.handleServiceRequestChange = this.handleServiceRequestChange.bind(this);
        this.handleMedicationRequestChange = this.handleMedicationRequestChange.bind(this);
        this.updateDeviceRequest = this.updateDeviceRequest.bind(this);
        this.updateServiceRequest = this.updateServiceRequest.bind(this);
        this.updateMedicationRequest = this.updateMedicationRequest.bind(this);
    }

    makeOption(request) {
        let a;
        if (request.resourceType === 'DeviceRequest') {
            a = request.codeCodeableConcept.coding[0].code;
        } else if (request.resourceType === 'ServiceRequest') {
            if (request.code) {
                a = request.code.coding[0].code;
            }
        }
        return <option value={JSON.stringify(request)} key={request.id} label={a}>{a}</option>
    }

    gatherResources() {

    }

    updateValues(patient) {
        this.props.callback("patient", patient);
        this.props.callback("openPatient", false);
        this.props.clearCallback();
        if (this.state.deviceRequest !== "none") {
            this.updateDeviceRequest(patient);
        } else if (this.state.serviceRequest !== "none") {
            this.updateServiceRequest(patient);
        } else if (this.state.medicationRequest !== "none") {
            this.updateMedicationRequest(patient);
        }else {
            this.props.clearCallback();
        }
    }

    updateServiceRequest(patient) {
        const devR = JSON.parse(this.state.serviceRequest);
        this.props.callback("serviceRequest", devR);
        this.props.updateServiceRequestCallback(devR);
        const code = devR.code.coding[0].code;
        const system = devR.code.coding[0].system;
        let text = "Unknown";
        if (devR.code.coding[0].display) {
            text = devR.code.coding[0].display;
        }
        this.props.callback("code", code);
        this.props.callback("codeSystem", system);
        this.props.callback("display", text);
        if (this.props.options.filter((e) => { return e.value === code && e.codeSystem === system; }).length === 0) {
            this.props.callback("codeValues", [{ key: text, codeSystem: system, value: code }, ...this.props.options]);
        }
        if (patient.address && patient.address[0].state) {
            this.props.callback("patientState", patient.address[0].state);
        }
        else {
            this.props.callback("patientState", "");
        }
        if (devR.performer) {
            if (devR.performer[0].reference) {
                fetch(`${this.props.ehrUrl}${devR.performer[0].reference}`, {
                    method: "GET",
                }).then(response => {
                    return response.json();
                }).then(json => {
                    if (json.address && json.address[0].state) {
                        this.props.callback("practitionerState", json.address[0].state);
                    }
                    else {
                        this.props.callback("practitionerState", "");
                    }
                });
            }
        }
        else {
            this.props.callback("practitionerState", "");
        }
    }

    updateDeviceRequest(patient) {
        const devR = JSON.parse(this.state.deviceRequest);
        this.props.callback("deviceRequest", devR);
        this.props.updateDeviceRequestCallback(devR);
        const code = devR.codeCodeableConcept.coding[0].code;
        const system = devR.codeCodeableConcept.coding[0].system;
        let text = "Unknown";
        if (devR.codeCodeableConcept.coding[0].display) {
            text = devR.codeCodeableConcept.coding[0].display;
        }
        this.props.callback("code", code);
        this.props.callback("codeSystem", system);
        this.props.callback("display", text);
        if (this.props.options.filter((e) => { return e.value === code && e.codeSystem === system; }).length === 0) {
            this.props.callback("codeValues", [{ key: text, codeSystem: system, value: code }, ...this.props.options]);
        }
        if (patient.address && patient.address[0].state) {
            this.props.callback("patientState", patient.address[0].state);
        }
        else {
            this.props.callback("patientState", "");
        }
        if (devR.performer) {
            if (devR.performer.reference) {
                fetch(`${this.props.ehrUrl}${devR.performer.reference}`, {
                    method: "GET",
                }).then(response => {
                    return response.json();
                }).then(json => {
                    if (json.address && json.address[0].state) {
                        this.props.callback("practitionerState", json.address[0].state);
                    }
                    else {
                        this.props.callback("practitionerState", "");
                    }
                });
            }
        }
        else {
            this.props.callback("practitionerState", "");
        }
    }

    updateMedicationRequest(patient) {
    }

    handleDeviceRequestChange(e) {
        this.setState({ deviceRequest: e.target.value, serviceRequest: "none" });
    }

    handleServiceRequestChange(e) {
        this.setState({ serviceRequest: e.target.value, deviceRequest: "none" });
    }

    handleMedicationRequestChange(e) {
        this.setState({ medicationRequest: e.target.value, medicationRequest: "none" });
    }

    render() {
        const patient = this.props.patient;
        let name = "";
        if (patient.name) {
            name = <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>
        }
        return (
            <div>

                <div className="patient-selection-box" key={patient.id} onClick={() => {
                    this.updateValues(patient);
                }}>
                    <div className="patient-info">
                        <span style={{ fontWeight: "bold" }}>ID</span>: {patient.id}
                        {/* <a className="more-info">
                                {text}
                            </a> */}
                        <div><span style={{ fontWeight: "bold" }}>Name</span>: {name ? name : "N/A"}</div>
                        <div><span style={{ fontWeight: "bold" }}>Gender</span>: {patient.gender}</div>
                        <div><span style={{ fontWeight: "bold" }}>Age</span>: {getAge(patient.birthDate)}</div>
                    </div>
                    <div className="request-info">
                        <span style={{ fontWeight: "bold", marginRight: "5px" }}>Device Request:</span>
                        <select value={this.state.deviceRequest} onChange={this.handleDeviceRequestChange} onClick={(event) => { event.stopPropagation() }} className="request-selector">
                            {this.props.deviceRequests ?
                                this.props.deviceRequests.data.map((e) => { return this.makeOption(e) }) : null}
                            <option value="none">
                                None
                                </option>
                        </select>
                    </div>
                    <div className="request-info">
                        <span style={{ fontWeight: "bold", marginRight: "5px" }}>Service Request:</span>
                        <select value={this.state.serviceRequest} onChange={this.handleServiceRequestChange} onClick={(event) => { event.stopPropagation() }} className="request-selector">
                            {this.props.serviceRequests ?
                                this.props.serviceRequests.data.map((e) => { return this.makeOption(e) }) : null}
                            <option value="none">
                                None
                                </option>
                        </select>
                    </div>
                    <div className="request-info">
                        <span style={{ fontWeight: "bold", marginRight: "5px" }}>Medication Request:</span>
                        <select value={this.state.medicationRequest} onChange={this.handleMedicationRequestChange} onClick={(event) => { event.stopPropagation() }} className="request-selector">
                            {this.props.medicationRequests ?
                                this.props.medicationRequests.data.map((e) => { return this.makeOption(e) }) : null}
                            <option value="none">
                                None
                                </option>
                        </select>
                    </div>
                </div>
            </div>
        )
    }
}