import React, { Component } from "react";
import FHIR from "fhirclient";
import SMARTBox from "../SMARTBox/SMARTBox";
import PatientBox from "../SMARTBox/PatientBox";
import { defaultValues, shortNameMap } from "../../util/data";
import { getAge } from "../../util/fhir";
import _ from "lodash";
import "./request.css";
import axios from 'axios';

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
      otherResources: [],
      codeValues: defaultValues,
      patientState: null,
      practitionerState: null,
      code: null,
      codeSystem: null,
      display: null,
      serviceRequest: {},
      insurance: {},
      medicationRequest: {},
      medicationDispense: {},
      gatherCount: 0,
      response: {}
    };

    this.renderRequestResources = this.renderRequestResources.bind(this);
    this.addReferencesToList = this.addReferencesToList.bind(this);
    this.checkForReferences = this.checkForReferences.bind(this);
    this.renderPatientInfo = this.renderPatientInfo.bind(this);
    this.renderOtherInfo = this.renderOtherInfo.bind(this);
    this.renderResource = this.renderResource.bind(this);
    this.renderPrefetchedResources = this.renderPrefetchedResources.bind(this);
    this.renderError = this.renderError.bind(this);
    this.buildLaunchLink = this.buildLaunchLink.bind(this);
  }

  // TODO - see how to submit response for alternative therapy
  replaceRequestAndSubmit(request) {
    let resourceType = request.resourceType.toUpperCase();
    console.log("replaceRequestAndSubmit: " + request.resourceType);

    // replace the request in the state with the new one
    if (resourceType === "DEVICEREQUEST") {
      this.setState({ deviceRequest: request });
    } else if (resourceType === "SERVICEREQUEST") {
      this.setState({ serviceRequest: request });
    } else if (resourceType === "MEDICATIONREQUEST") {
        this.setState({ medicationRequest: request });
    } else if (resourceType === "MEDICATIONDISPENSE") {
      this.setState({ medicationDispense: request });
    }

    // build the prefetch
    const prefetch = this.makePrefetch(request);

    // submit the CRD request
    this.props.submitInfo(prefetch, request, undefined, this.state.patient, null, "order-sign");
  }

  componentDidMount() {}

  exitSmart = () => {
    this.setState({ openPatient: false });
  };

  wrapPrefetchItems(resources) {
    return resources.reduce((pre, resource) => {
      if (resource.id) {
        pre.push({ resource });
      }
      return pre;
    }, []);
  }

  makePrefetch(request) {
    let resourceType = request.resourceType.toUpperCase();

    if ( (resourceType === "DEVICEREQUEST") 
      || (resourceType === "SERVICEREQUEST") 
      || (resourceType === "MEDICATIONREQUEST") ) {
      
      const resources = [
        this.state.patient,
        request,
        this.state.coverage,
        this.state.practitioner,
        ...this.state.otherResources,
      ];

      return this.wrapPrefetchItems(resources);

    } else if (resourceType === "MEDICATIONDISPENSE") {

      
      const medicationDispenseResources = [
        this.state.patient,
        request,
        this.state.practitioner,
        ...this.state.otherResources,
      ];
      return this.wrapPrefetchItems(medicationDispenseResources);
    }
  }

  submit = () => {
    if (!_.isEmpty(this.state.deviceRequest)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.deviceRequest),
        this.state.deviceRequest,
        this.state.response,
        this.state.patient,
        null,
        "order-sign"
      );
    } else if (!_.isEmpty(this.state.serviceRequest)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.serviceRequest),
        this.state.serviceRequest,
        this.state.response,
        this.state.patient,
        null,
        "order-sign"
      );
    } else if (!_.isEmpty(this.state.medicationRequest)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.medicationRequest),
        this.state.medicationRequest,
        this.state.response,
        this.state.patient,
        null,
        "order-sign"
      );
    } else if (!_.isEmpty(this.state.medicationDispense)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.medicationDispense),
        this.state.medicationDispense,
        this.state.response,
        this.state.patient,
        null,
        "order-sign"
      );
    }
  };

  updateStateElement = (elementName, text) => {
    this.setState({ [elementName]: text });
  };

  updateStateList = (elementName, text) => {
    this.setState((prevState) => ({
      [elementName]: [...prevState[elementName], text],
    }));
  };

  clearState = () => {
    this.setState({
      otherResources: [],
      practitioner: {},
      deviceRequest: {},
      coverage: {},
      serviceRequest: {},
      medicationRequest: {},
      medicationDispense: {},
      response: {}
    });
  };

  addReferencesToList(data) {
    Object.keys(data).forEach((refKey) => {
      this.updateStateList("otherResources", data[refKey]);
    });
  }

  checkIfGatherCompleted(client, request, response) {
    // decrement the gatherCount and prepare to send the order select if the gathers have finished
    this.setState({ gatherCount: (this.state.gatherCount - 1) })
    if (this.state.gatherCount === 0) {

      // currently only MedicationRequest has a use case for the OrderSelect hook
      if (request.resourceType.toUpperCase() === "MEDICATIONREQUEST") {

        // retrieve the MedicationStatements
        client.request(`MedicationStatement?subject=${this.state.patient.id}&_include=MedicationStatement:patient`, {
          graph: false,
          flat: true
        })
        .then((result) => {

          const extraPrefetch = this.wrapPrefetchItems(result);

          // build the prefetch
          const prefetch = this.makePrefetch(request);

          // submit the OrderSelect hook CRD request
          this.props.submitInfo(prefetch, request, response, this.state.patient, extraPrefetch, "order-select");
        });
      }
    }
  }

  gatherDeviceRequestResources = (deviceRequest, response) => {
    const client = FHIR.client({
      serverUrl: this.props.ehrUrl,
      tokenResponse: {
        access_token: this.props.access_token.access_token,
      },
    });
    // If the device request is provided it has the pertinent information.
    // this is for STU3
    // TODO: Update for R4
    this.setState({ gatherCount: 1 });
    client
      .request(`DeviceRequest/${deviceRequest.id}`, {
        resolveReferences: ["performer", "insurance.0"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        const references = result.references;
        Object.keys(references).forEach((refKey) => {
          const ref = references[refKey];
          if (ref.resourceType === "Coverage") {
            // keep track of whether gathering is completed
            this.setState({ gatherCount: (this.state.gatherCount + 1) })
            client
              .request(`Coverage/${ref.id}`, {
                resolveReferences: ["payor"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                this.addReferencesToList(result.references);
              })
              .finally((info) => { this.checkIfGatherCompleted(client, deviceRequest, response); });
            this.setState({ coverage: ref });
          } else if (ref.resourceType === "Practitioner") {
            this.setState({ practitioner: ref });
            // find pracRoles
            // keep track of whether gathering is completed
            this.setState({ gatherCount: (this.state.gatherCount + 1) })
            client
              .request(`PractitionerRole?practitioner=${ref.id}`, {
                resolveReferences: ["location"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                // TODO: Better logic here
                this.addReferencesToList(result.references);
                this.addReferencesToList(result.data);
              })
              .finally((info) => { this.checkIfGatherCompleted(client, deviceRequest); });
          }
        });
      })
      .finally((info) => { this.checkIfGatherCompleted(client, deviceRequest); });
  };

  gatherServiceRequestResources = (serviceRequest, response) => {
    const client = FHIR.client({
      serverUrl: this.props.ehrUrl,
      tokenResponse: {
        access_token: this.props.access_token.access_token,
      },
    });

    // If the service request is provided it has the pertinent information.
    // this is for R4
    this.setState({ gatherCount: 1 });
    client
      .request(`ServiceRequest/${serviceRequest.id}`, {
        resolveReferences: ["performer", "insurance.0"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        const references = result.references;
        Object.keys(references).forEach((refKey) => {
          const ref = references[refKey];
          if (ref.resourceType === "Coverage") {
            // keep track of whether gathering is completed
            this.setState({ gatherCount: (this.state.gatherCount + 1) })
            client
              .request(`Coverage/${ref.id}`, {
                resolveReferences: ["payor"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                this.addReferencesToList(result.references);
              })
              .finally((info) => { this.checkIfGatherCompleted(client, serviceRequest, response); });
            this.setState({ coverage: ref });
          } else if (ref.resourceType === "Practitioner") {
            this.setState({ practitioner: ref });
            // find pracRoles
            // keep track of whether gathering is completed
            this.setState({ gatherCount: (this.state.gatherCount + 1) })
            client
              .request(`PractitionerRole?practitioner=${ref.id}`, {
                resolveReferences: ["location"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                // TODO: Better logic here
                this.addReferencesToList(result.references);
                this.addReferencesToList(result.data);
              })
              .finally((info) => { this.checkIfGatherCompleted(client, serviceRequest); });
          }
        });
      })
      .finally((info) => { this.checkIfGatherCompleted(client, serviceRequest); });
  };

  gatherMedicationRequestResources = (medicationRequest, response) => {
    const client = FHIR.client({
      serverUrl: this.props.ehrUrl,
      tokenResponse: {
        access_token: this.props.access_token.access_token,
      },
    });

    this.setState({ gatherCount: 1 });
    client
      .request(`MedicationRequest/${medicationRequest.id}`, {
        resolveReferences: ["requester", "insurance.0"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        const references = result.references;
        Object.keys(references).forEach((refKey) => {
          const ref = references[refKey];
          if (ref.resourceType === "Coverage") {
            // keep track of whether gathering is completed
            this.setState({ gatherCount: (this.state.gatherCount + 1) })
            client
              .request(`Coverage/${ref.id}`, {
                resolveReferences: ["payor"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                this.addReferencesToList(result.references);
              })
              .finally((info) => { this.checkIfGatherCompleted(client, medicationRequest, response); });
            this.setState({ coverage: ref });
          } else if (ref.resourceType === "Practitioner") {
            // keep track of whether gathering is completed
            this.setState({ gatherCount: (this.state.gatherCount + 1) })
            this.setState({ practitioner: ref });
            // find pracRoles
            client
              .request(`PractitionerRole?practitioner=${ref.id}`, {
                resolveReferences: ["location"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                // TODO: Better logic here
                this.addReferencesToList(result.references);
                this.addReferencesToList(result.data);
              })
              .finally((info) => { this.checkIfGatherCompleted(client, medicationRequest); });
          }
        });
      })
      .finally((info) => { this.checkIfGatherCompleted(client, medicationRequest); });
  };

  gatherMedicationDispenseResources = (medicationDispense, response) => {
    const client = FHIR.client({
      serverUrl: this.props.ehrUrl,
      tokenResponse: {
        access_token: this.props.access_token.access_token,
      },
    });

    this.setState({ gatherCount: 1 });
    // authorizingPrescription reference can't be resolved. 
    // An issue is opened in fhir client repo: https://github.com/smart-on-fhir/client-js/issues/131
    client
      .request(`MedicationDispense/${medicationDispense.id}`, {
        resolveReferences: ["performer.0.actor", "authorizingPrescription.0"], 
        graph: false,
        flat: true,
      })
      .then((result) => {
        const references = result.references;
        Object.keys(references).forEach((refKey) => {
          const ref = references[refKey];
          if (ref.resourceType === "Practitioner") {
            this.setState({ practitioner: ref });
            // find pracRoles
            // keep track of whether gathering is completed
            this.state.gatherCount = this.state.gatherCount + 1;
            client
              .request(`PractitionerRole?practitioner=${ref.id}`, {
                resolveReferences: ["location"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                // TODO: Better logic here
                this.addReferencesToList(result.references);
                this.addReferencesToList(result.data);
              })
              .finally((info) => { this.checkIfGatherCompleted(client, medicationDispense, response); });
          }
        });

        // work around authorizingPrescription reference can not be resolved issue 
        if (medicationDispense.authorizingPrescription != undefined && medicationDispense.authorizingPrescription.length > 0) {
          let medicationRequestReference = medicationDispense.authorizingPrescription[0].reference;
          if (medicationRequestReference) {
            this.state.gatherCount = this.state.gatherCount + 1;
            client
              .request(medicationRequestReference, {
                resolveReferences: ["insurance.0"],
                graph: false,
                flat: true,
              })
              .then((result) => {
                this.state.gatherCount = this.state.gatherCount + 1;
                let coverageReference = result.references;
                Object.keys(coverageReference).forEach((refKey) => {
                  const ref = coverageReference[refKey];
                  if (ref.resourceType === "Coverage") {
                    client
                      .request(`Coverage/${ref.id}`, {
                        resolveReferences: ["payor"],
                        graph: false,
                        flat: true,
                      })
                      .then((result) => {
                        this.addReferencesToList(result.references);
                      })
                      .finally((info) => { this.checkIfGatherCompleted(client, medicationDispense, response); });
                  }
                });
              })
              .finally((info) => { this.checkIfGatherCompleted(client, medicationDispense, response); });
          }
        }
      })
      .finally((info) => { this.checkIfGatherCompleted(client, medicationDispense, response); });
  };

  checkForReferences(client, resource, references) {
    client
      .request(`${resource.resourceType}/${resource.id}`, {
        resolveReferences: references,
        graph: false,
        flat: true,
      })
      .then((result) => {
        console.log(result);
      });
  }

  getPatients = () => {
    console.log(this.props.access_token.access_token);
    this.setState({ openPatient: true });
    const params = {serverUrl: this.props.ehrUrl};
    console.log(this.props.access_token.access_token);
    if (this.props.access_token.access_token) {
        params["tokenResponse"] = {access_token: this.props.access_token.access_token}
    }
    console.log(params);
    const client = FHIR.client(
      params
    );

    client
      .request("Patient?_sort=identifier&_count=12", { flat: true })
      .then((result) => {
        this.setState({
          patientList: result,
        });
      })
      .catch((e) => {
        this.setState({
          patientList: e,
        });
      });
  };

  renderPatientInfo() {
    const patient = this.state.patient;
    let name;
    if (patient.name) {
      name = (
        <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>
      );
    } else {
      name = "N/A";
    }
    return (
      <div className="demographics">
        <div className="lower-border">
          <span style={{ fontWeight: "bold" }}>Demographics</span>
        </div>
        <div className="info lower-border">Name: {name}</div>
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
    );
  }

  renderOtherInfo() {
    return (
      <div className="other-info">
        <div className="lower-border">
          <span style={{ fontWeight: "bold" }}>Coding</span>
        </div>
        <div className="info lower-border">
          Code: {this.state.code ? this.state.code : "N/A"}
        </div>
        <div className="info lower-border">
          System:{" "}
          {this.state.codeSystem ? shortNameMap[this.state.codeSystem] : "N/A"}
        </div>
        <div className="info lower-border">
          Display: {this.state.display ? this.state.display : "N/A"}
        </div>
      </div>
    );
  }

  renderQRInfo() {
    const qrResponse = this.state.response;
    return (
      <div className="questionnaire-response">
        <div className="lower-border">
          <span style={{ fontWeight: "bold" }}>In Progress Form</span>
          <div className="info lower-border">Form: { qrResponse.questionnaire ? qrResponse.questionnaire : "N/A"}</div>
          <div className="info lower-border">
            Author: {qrResponse.author ? qrResponse.author.reference : "N/A"}
          </div>
          <div className="info lower-border">
            Date: {qrResponse.authored ? qrResponse.authored : "N/A"}
          </div>
        </div>
      </div>
    );
  }

  renderPrefetchedResources() {
    const deviceRequestResources = [
      "patient",
      "deviceRequest",
      "coverage",
      "practitioner",
    ];
    const serviceRequestResources = [
      "patient",
      "serviceRequest",
      "coverage",
      "practitioner",
    ];
    const medicationRequestResources = [
      "patient",
      "medicationRequest",
      "coverage",
      "practitioner",
    ];
    const medicationDispenseResources = [
      "patient",
      "medicationDispense",
      "practitioner",
    ];
    if (!_.isEmpty(this.state.deviceRequest)) {
      return this.renderRequestResources(deviceRequestResources);
    } else if (!_.isEmpty(this.state.serviceRequest)) {
      return this.renderRequestResources(serviceRequestResources);
    } else if (!_.isEmpty(this.state.medicationRequest)) {
      return this.renderRequestResources(medicationRequestResources);
    } else if (!_.isEmpty(this.state.medicationDispense)) {
      return this.renderRequestResources(medicationDispenseResources);
    }
  }

  renderRequestResources(requestReources) {
    return (
      <div className="prefetched">
        <div className="prefetch-header">Prefetched</div>
        {requestReources.map((resource) => {
          return this.renderResource(resource);
        })}
        <div className="prefetch-header">Other Resources</div>
        {this.state.otherResources.map((resource) => {
          return this.renderOtherResources(resource);
        })}
      </div>
    );
  }

  renderResource(resourceType) {
    let value = <div>N/A</div>;
    if (this.state[resourceType].id) {
      value = (
        <div key={this.state[resourceType].id}>
          <span style={{ textTransform: "capitalize" }}>{resourceType}</span>:{" "}
          {this.state[resourceType].resourceType}/{this.state[resourceType].id}{" "}
          .....<span className="checkmark glyphicon glyphicon-ok"></span>
        </div>
      );
    } else {
      value = (
        <div key={resourceType}>
          <span style={{ textTransform: "capitalize" }}>{resourceType}</span>{" "}
          .....<span className="remove glyphicon glyphicon-remove"></span>
        </div>
      );
    }
    return value;
  }

  renderOtherResources(resource, name) {
    let value = <div>N/A</div>;
    if (resource.id) {
      value = (
        <div key={resource.id}>
          {resource.resourceType}/{resource.id} .....
          <span className="checkmark glyphicon glyphicon-ok"></span>
        </div>
      );
    } else {
      value = (
        <div key={name}>
          <span style={{ textTransform: "capitalize" }}>{name}</span> .....
          <span className="remove glyphicon glyphicon-remove"></span>
        </div>
      );
    }
    return value;
  }

  renderError() {
    return (
      <span className="patient-error">{this.state.patientList.message}</span>
    );
  }

  /**
   * Relaunch DTR using the available context
   */
  relaunch = (e) => {
    this.buildLaunchLink()
      .then(link => {
        //e.preventDefault();
        window.open(link.url, "_blank");
      });
  }

  buildLaunchLink() {
    // build appContext and URL encode it
    let appContext = "";
    let order = undefined, coverage = undefined, response = undefined;

    if (!this.isOrderNotSelected()) {
      if (Object.keys(this.state.deviceRequest).length > 0) {
        order = `${this.state.deviceRequest.resourceType}/${this.state.deviceRequest.id}`;

        if (this.state.deviceRequest.insurance && this.state.deviceRequest.insurance.length > 0) {
          coverage = `${this.state.deviceRequest.insurance[0].reference}`;
        }
      } else if (Object.keys(this.state.serviceRequest).length > 0) {
        order = `${this.state.serviceRequest.resourceType}/${this.state.serviceRequest.id}`;

        if (this.state.serviceRequest.insurance && this.state.serviceRequest.insurance.length > 0) {
          coverage = `${this.state.serviceRequest.insurance[0].reference}`;
        }
      } else if (Object.keys(this.state.medicationRequest).length > 0) {
        order = `${this.state.medicationRequest.resourceType}/${this.state.medicationRequest.id}`;

        if (this.state.medicationRequest.insurance && this.state.medicationRequest.insurance.length > 0) {
          coverage = `${this.state.medicationRequest.insurance[0].reference}`;
        }
      } else if (Object.keys(this.state.medicationDispense).length > 0) {
        order = `${this.state.medicationDispense.resourceType}/${this.state.medicationDispense.id}`;
      }
    }

    if(order) {
      appContext += `order=${order}`

      if(coverage) {
        appContext += `&coverage=${coverage}`
      }
    }
    
    if(Object.keys(this.state.response).length > 0) {
      response = `QuestionnaireResponse/${this.state.response.id}`;
    }
    
    if(order && response) {
      appContext += `&response=${response}`
    } else if (!order && response) {
      appContext += `response=${response}`
    } 

    const link = {
      appContext: encodeURIComponent(appContext),
      type: "smart",
      url: this.props.launchUrl
    }

    let linkCopy = Object.assign({}, link);
   
    return this.props.retrieveLaunchContext(
      linkCopy, this.props.fhirAccessToken,
        this.state.patient.id, this.props.fhirServerUrl, this.props.fhirVersion
    ).then((result) => {
        linkCopy = result;
        return linkCopy;
    });
  }

  isOrderNotSelected() {
    return Object.keys(this.state.deviceRequest).length === 0 && Object.keys(this.state.serviceRequest).length === 0
      && Object.keys(this.state.medicationRequest).length === 0 && Object.keys(this.state.medicationDispense).length === 0;
  }

  render() {
    const params = {};
    params['serverUrl'] = this.props.ehrUrl;
    if (this.props.access_token) {
        params['tokenResponse'] = {access_token: this.props.access_token.access_token};
    }
    const disableSendToCRD = this.isOrderNotSelected();
    const disableLaunchDTR = this.isOrderNotSelected() && Object.keys(this.state.response).length === 0;
    return (
      <div>
        <div className="request">
          {this.state.openPatient ? (
            <div>
              <SMARTBox exitSmart={this.exitSmart}>
                <div className="patient-box">
                  {this.state.patientList instanceof Error
                    ? this.renderError()
                    : this.state.patientList.map((patient) => {
                        return (
                          <PatientBox
                            key={patient.id}
                            patient={patient}
                            params = {params}
                            callback={this.updateStateElement}
                            updateDeviceRequestCallback={
                              this.gatherDeviceRequestResources
                            }
                            updateServiceRequestCallback={
                              this.gatherServiceRequestResources
                            }
                            updateMedicationRequestCallback={
                              this.gatherMedicationRequestResources
                            }
                            updateMedicationDispenseCallback={
                              this.gatherMedicationDispenseResources
                            }
                            clearCallback={this.clearState}
                            ehrUrl={this.props.ehrUrl}
                            options={this.state.codeValues}
                            responseExpirationDays={this.props.responseExpirationDays}
                          />
                        );
                      })}
                </div>
              </SMARTBox>
            </div>
          ) : (
            ""
          )}

          <div>
            <button className="select-button" onClick={this.getPatients}>
              Patient Select:
            </button>
            <div className="request-header">
              {this.state.patient.id ? this.state.patient.id : "N/A"}
            </div>
            <div>
              {this.renderPatientInfo()}
              {this.renderPrefetchedResources()}
            </div> 
           <div>{this.renderQRInfo()}</div>   
          </div>
        </div>
        <button className={"submit-btn btn btn-class "} onClick={this.relaunch} disabled={disableLaunchDTR}>
          Relaunch DTR
        </button>
        <button className={"submit-btn btn btn-class "} onClick={this.submit} disabled={disableSendToCRD}>
          Submit to CRD
        </button>
      </div>
    );
  }
}
