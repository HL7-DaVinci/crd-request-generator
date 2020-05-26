import React, { Component } from "react";
import { getAge } from "../../util/fhir";
import "./smart.css";
export default class SMARTBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: "none",
      requestDisplay: "none"
    };

    this.handleRequestChange = this.handleRequestChange.bind(this);

    this.updateDeviceRequest = this.updateDeviceRequest.bind(this);
    this.updateServiceRequest = this.updateServiceRequest.bind(this);
    this.updateMedicationRequest = this.updateMedicationRequest.bind(this);
  }

  getCoding(request) {
    let code = null;
    if (request.resourceType === "DeviceRequest") {
      code = request.codeCodeableConcept.coding[0];
    } else if (request.resourceType === "ServiceRequest") {
      code = request.code.coding[0];
    } else if (request.resourceType === "MedicationRequest") {
      code = request.medicationCodeableConcept.coding[0];
    }
    if (code) {
      if (!code.code) {
        code.code = "Unknown";
      }
      if (!code.display) {
        code.display = "Unknown";
      }
      if (!code.system) {
        code.system = "Unknown";
      }
    } else {
      code.code = "Unknown";
      code.display = "Unknown";
      code.system = "Unknown";
    }
    return code;
  }

  makeOption(request) {
    let code = this.getCoding(request).code;
    return (
      <option value={JSON.stringify(request)} key={request.id} label={code + " (" + request.resourceType + ")"}>
        {code}
      </option>
    );
  }

  gatherResources() {}

  updateValues(patient) {
    this.props.callback("patient", patient);
    this.props.callback("openPatient", false);
    this.props.clearCallback();
    const request = JSON.parse(this.state.request);
    if (request.resourceType === "DeviceRequest") {
      this.updateDeviceRequest(patient, request);
    } else if (request.resourceType === "ServiceRequest") {
      this.updateServiceRequest(patient, request);
    } else if (request.resourceType === "MedicationRequest") {
      this.updateMedicationRequest(patient, request);
    } else {
      this.props.clearCallback();
    }
  }

  updateServiceRequest(patient, serviceRequest) {
    this.props.callback("serviceRequest", serviceRequest);
    this.props.updateServiceRequestCallback(serviceRequest);
    const coding = this.getCoding(serviceRequest);
    const code = coding.code;
    const system = coding.system;
    const text = coding.display;
    this.props.callback("code", code);
    this.props.callback("codeSystem", system);
    this.props.callback("display", text);
    if (
      this.props.options.filter((e) => {
        return e.value === code && e.codeSystem === system;
      }).length === 0
    ) {
      this.props.callback("codeValues", [
        { key: text, codeSystem: system, value: code },
        ...this.props.options,
      ]);
    }
    if (patient.address && patient.address[0].state) {
      this.props.callback("patientState", patient.address[0].state);
    } else {
      this.props.callback("patientState", "");
    }
    if (serviceRequest.performer) {
      if (serviceRequest.performer[0].reference) {
        fetch(`${this.props.ehrUrl}${serviceRequest.performer[0].reference}`, {
          method: "GET",
        })
          .then((response) => {
            return response.json();
          })
          .then((json) => {
            if (json.address && json.address[0].state) {
              this.props.callback("practitionerState", json.address[0].state);
            } else {
              this.props.callback("practitionerState", "");
            }
          });
      }
    } else {
      this.props.callback("practitionerState", "");
    }
  }

  updateDeviceRequest(patient, deviceRequest) {
    this.props.callback("deviceRequest", deviceRequest);
    this.props.updateDeviceRequestCallback(deviceRequest);
    const coding = this.getCoding(deviceRequest);
    const code = coding.code;
    const system = coding.system;
    const text = coding.display;
    this.props.callback("code", code);
    this.props.callback("codeSystem", system);
    this.props.callback("display", text);
    if (
      this.props.options.filter((e) => {
        return e.value === code && e.codeSystem === system;
      }).length === 0
    ) {
      this.props.callback("codeValues", [
        { key: text, codeSystem: system, value: code },
        ...this.props.options,
      ]);
    }
    if (patient.address && patient.address[0].state) {
      this.props.callback("patientState", patient.address[0].state);
    } else {
      this.props.callback("patientState", "");
    }
    if (deviceRequest.performer) {
      if (deviceRequest.performer.reference) {
        fetch(`${this.props.ehrUrl}${deviceRequest.performer.reference}`, {
          method: "GET",
        })
          .then((response) => {
            return response.json();
          })
          .then((json) => {
            if (json.address && json.address[0].state) {
              this.props.callback("practitionerState", json.address[0].state);
            } else {
              this.props.callback("practitionerState", "");
            }
          });
      }
    } else {
      this.props.callback("practitionerState", "");
    }
  }

  updateMedicationRequest(patient, medicationRequest) {
    this.props.callback("medicationRequest", medicationRequest);
    this.props.updateMedicationRequestCallback(medicationRequest);
    const coding = this.getCoding(medicationRequest);
    const code = coding.code;
    const system = coding.system;
    const text = coding.display;
    this.props.callback("code", code);
    this.props.callback("codeSystem", system);
    this.props.callback("display", text);
    if (
      this.props.options.filter((e) => {
        return e.value === code && e.codeSystem === system;
      }).length === 0
    ) {
      this.props.callback("codeValues", [
        { key: text, codeSystem: system, value: code },
        ...this.props.options,
      ]);
    }
    if (patient.address && patient.address[0].state) {
      this.props.callback("patientState", patient.address[0].state);
    } else {
      this.props.callback("patientState", "");
    }
    if (medicationRequest.requester) {
      if (medicationRequest.requester.reference) {
        fetch(`${this.props.ehrUrl}${medicationRequest.requester.reference}`, {
          method: "GET",
        })
          .then((response) => {
            return response.json();
          })
          .then((json) => {
            if (json.address && json.address[0].state) {
              this.props.callback("practitionerState", json.address[0].state);
            } else {
              this.props.callback("practitionerState", "");
            }
          });
      }
    } else {
      this.props.callback("practitionerState", "");
    }
  }

  handleRequestChange(e) {
    if (e.target.value === "none") {
      this.setState({
        request: "none",
        requestDisplay: "none"
      });
    } else {
      let request = JSON.parse(e.target.value);
      let coding = this.getCoding(request);
      //console.log(request.resourceType + " for code " + coding.code + " selected");
      this.setState({
        request: e.target.value,
        requestDisplay: coding.display
      });
    }
  }

  render() {
    const patient = this.props.patient;
    let name = "";
    if (patient.name) {
      name = (
        <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>
      );
    }
    return (
      <div>
        <div
          className="patient-selection-box"
          key={patient.id}
          onClick={() => {
            this.updateValues(patient);
          }}
        >
          <div className="patient-info">
            <span style={{ fontWeight: "bold" }}>ID</span>: {patient.id}
            {/* <a className="more-info">
                                {text}
                            </a> */}
            <div>
              <span style={{ fontWeight: "bold" }}>Name</span>:{" "}
              {name ? name : "N/A"}
            </div>
            <div>
              <span style={{ fontWeight: "bold" }}>Gender</span>:{" "}
              {patient.gender}
            </div>
            <div>
              <span style={{ fontWeight: "bold" }}>Age</span>:{" "}
              {getAge(patient.birthDate)}
            </div>
          </div>
          <div className="request-info">
            <span style={{ fontWeight: "bold", marginRight: "5px" }}>
              Request:
            </span>
            <select
              value={this.state.request}
              onChange={this.handleRequestChange}
              onClick={(event) => {
                event.stopPropagation();
              }}
              className="request-selector"
            >
              {this.props.deviceRequests
                ? this.props.deviceRequests.data.map((e) => {
                    return this.makeOption(e);
                  })
                : null}
              {this.props.serviceRequests
              ? this.props.serviceRequests.data.map((e) => {
                  return this.makeOption(e);
                })
              : null}
              {this.props.medicationRequests
              ? this.props.medicationRequests.data.map((e) => {
                  return this.makeOption(e);
                })
              : null}
              <option value="none">None</option>
            </select>
            <div>
              <span style={{ fontWeight: "bold" }}>Details</span>:{" "}
              {this.state.requestDisplay}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
