import React, { Component } from "react";
import { Dropdown, Header } from 'semantic-ui-react'
import { getAge } from "../../util/fhir";
import FHIR from "fhirclient";
import "./smart.css";


export default class SMARTBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: "none",
      deviceRequests: {},
      medicationRequests: {},
      serviceRequests: {},
      medicationDispenses: {}
    };

    this.handleRequestChange = this.handleRequestChange.bind(this);

    this.updateDeviceRequest = this.updateDeviceRequest.bind(this);
    this.updateServiceRequest = this.updateServiceRequest.bind(this);
    this.updateMedicationRequest = this.updateMedicationRequest.bind(this);
    this.updateMedicationDispense = this.updateMedicationDispense.bind(this);
    this.getDeviceRequest = this.getDeviceRequest.bind(this);
    this.getServiceRequest = this.getServiceRequest.bind(this);
    this.getMedicationRequest = this.getMedicationRequest.bind(this);
    this.getMedicationDispense = this.getMedicationDispense.bind(this);
    this.getRequests = this.getRequests.bind(this);

  }

  getCoding(request) {
    let code = null;
    if (request.resourceType === "DeviceRequest") {
      code = request.codeCodeableConcept.coding[0];
    } else if (request.resourceType === "ServiceRequest") {
      code = request.code.coding[0];
    } else if (request.resourceType === "MedicationRequest") {
      code = request.medicationCodeableConcept.coding[0];
    } else if (request.resourceType === "MedicationDispense") {
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

  makeOption(request, options) {
    let code = this.getCoding(request);

    let option = {
      key: request.id,
      text: "(" + code.code + ") " + code.display,
      value: JSON.stringify(request),
      content: (
        <Header content={code.code + " (" + request.resourceType + ")"} subheader={code.display} />
      )
    }
    options.push(option);
  }

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
    } else if (request.resourceType === "MedicationDispense") {
      this.updateMedicationDispense(patient, request);
    } 
      else {
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
        fetch(`${this.props.ehrUrl}/${serviceRequest.performer[0].reference}`, {
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
        fetch(`${this.props.ehrUrl}/${deviceRequest.performer.reference}`, {
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
        fetch(`${this.props.ehrUrl}/${medicationRequest.requester.reference}`, {
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

  updateMedicationDispense(patient, medicationDispense) {
    this.props.callback("medicationDispense", medicationDispense);
    this.props.updateMedicationDispenseCallback(medicationDispense);
    const coding = this.getCoding(medicationDispense);
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
    if (medicationDispense.performer) {
      if (medicationDispense.performer[0].actor.reference) {
        fetch(`${this.props.ehrUrl}/${medicationDispense.performer[0].actor.reference}`, {
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

  getDeviceRequest(patientId, client) {
    client
      .request(`DeviceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ deviceRequests: result });
      });
  }

  getServiceRequest(patientId, client) {
    client
      .request(`ServiceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ serviceRequests: result });
      });
  }

  getMedicationRequest(patientId, client) {
    client
      .request(`MedicationRequest?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ medicationRequests: result });
      });
  }

  getMedicationDispense(patientId, client) {
    client
      .request(`MedicationDispense?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ medicationDispenses: result});
      });
  }

  handleRequestChange(e, data) {
    if (data.value === "none") {
      this.setState({
        request: "none"
      });
    } else {
      let request = JSON.parse(data.value);
      let coding = this.getCoding(request);
      //console.log(request.resourceType + " for code " + coding.code + " selected");
      this.setState({
        request: data.value
      });
    }
  }
  
  getRequests() {
    const client = FHIR.client(
        this.props.params
      );
    const patientId = this.props.patient.id;
    this.getDeviceRequest(patientId, client);
    this.getServiceRequest(patientId, client);
    this.getMedicationRequest(patientId, client);
    this.getMedicationDispense(patientId, client);
  }

  render() {
    const patient = this.props.patient;
    let name = "";
    if (patient.name) {
      name = (
        <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>
      );
    }

    // add all of the requests to the list of options
    let options = []
    let returned = false;
    if (this.state.deviceRequests.data) {
      returned = true;
      console.log(this.state.deviceRequests);
      this.state.deviceRequests.data.map((e) => {
        this.makeOption(e, options);
      });
    }
    if (this.state.serviceRequests.data) {
      this.state.serviceRequests.data.map((e) => {
        this.makeOption(e, options);
      });
    }
    if (this.state.medicationRequests.data) {
        this.state.medicationRequests.data.map((e) => {
        this.makeOption(e, options);
      });
    }

    if (this.state.medicationDispenses.data) {
      this.state.medicationDispenses.data.map((e) => {
      this.makeOption(e, options);
    })};
    
    let noResults = 'No results found.'
    if(!returned) {
        noResults = 'Loading...';
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
            <Dropdown 
              search searchInput={{ type: 'text' }}
              selection fluid options={options} 
              placeholder='Choose an option' 
              noResultsMessage={noResults}
              onChange={this.handleRequestChange}
              onOpen={this.getRequests}
            />
          </div>
        </div>
      </div>
    );
  }
}
