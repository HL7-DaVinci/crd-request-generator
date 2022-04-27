import React, { Component } from "react";
import FHIR from "fhirclient";
import SMARTBox from "../SMARTBox/SMARTBox";
import PatientBox from "../SMARTBox/PatientBox";
import { defaultValues, shortNameMap } from "../../util/data";
import { getAge } from "../../util/fhir";
import _ from "lodash";
import "./request.css";
import { PrefetchTemplate } from "../../PrefetchTemplate";
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
      prefetchedResources: [],
      codeValues: defaultValues,
      code: null,
      codeSystem: null,
      display: null,
      request: {},
      gatherCount: 0,
      response: {}
    };

    this.renderRequestResources = this.renderRequestResources.bind(this);
    this.renderPatientInfo = this.renderPatientInfo.bind(this);
    this.renderOtherInfo = this.renderOtherInfo.bind(this);
    this.renderResource = this.renderResource.bind(this);
    this.renderPrefetchedResources = this.renderPrefetchedResources.bind(this);
    this.renderError = this.renderError.bind(this);
    this.buildLaunchLink = this.buildLaunchLink.bind(this);
  }

  // TODO - see how to submit response for alternative therapy
  replaceRequestAndSubmit(request) {
    console.log("replaceRequestAndSubmit: " + request.resourceType);
    this.setState({ request: request });
    // Prepare the prefetch.
    const prefetch = this.prepPrefetch();
    // Submit the CRD request.
    this.props.submitInfo(prefetch, request, this.state.patient, "order-sign");
  }

  componentDidMount() {}

  exitSmart = () => {
    this.setState({ openPatient: false });
  };

  prepPrefetch() {
    const preppedResources = this.state.prefetchedResources.map((resource) => {
      return {resource: resource.resource};
    });
    return preppedResources;
  }

  submit = () => {
    if (!_.isEmpty(this.state.request)) {
      this.props.submitInfo(
        this.prepPrefetch(),
        this.state.request,
        this.state.patient,
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
      prefetchedResources: [],
      practitioner: {},
      deviceRequest: {},
      coverage: {},
      serviceRequest: {},
      medicationRequest: {},
      medicationDispense: {},
      response: {}
    });
  };

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
        {this.renderQRInfo()}
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
          </div>
          <div className="info lower-border">Form: { qrResponse.questionnaire ? qrResponse.questionnaire : "N/A"}</div>
          <div className="info lower-border">
            Author: {qrResponse.author ? qrResponse.author.reference : "N/A"}
          </div>
          <div className="info lower-border">
            Date: {qrResponse.authored ? qrResponse.authored : "N/A"}
          </div>
        </div>
    );
  }

  renderPrefetchedResources() {
    if (!_.isEmpty(this.state.prefetchedResources)) {
      return this.renderRequestResources(this.state.prefetchedResources);
    }
  }

  renderRequestResources(requestResources) {
    var renderedPrefetches = [];
    requestResources.forEach((resource) => {
      renderedPrefetches.push(this.renderResource(resource));
    });
    return (
      <div className="prefetched">
        <div className="prefetch-header">Prefetched</div>
        {renderedPrefetches}
      </div>
    );
  }

  renderResource(resource) {
    let value = <div>N/A</div>;
    if (!resource.id) {
      resource = resource.resource;
    }
    if (resource.id) {
      var resourceId = resource.id;
      var resourceType = resource.resourceType;
      value = (
        <div key={resourceId}>
          <span style={{ textTransform: "capitalize" }}>{resourceType}</span>:{" "}
          {resourceType}/{resourceId}{" "}
          .....<span className="checkmark glyphicon glyphicon-ok"></span>
        </div>
      );
    } else {
      value = (
        <div key={"UNKNOWN"}>
          <span style={{ textTransform: "capitalize" }}>{"UNKNOWN"}</span>{" "}
          .....<span className="remove glyphicon glyphicon-remove"></span>
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
                            callbackList={this.updateStateList}
                            updatePrefetchCallback={
                              PrefetchTemplate.generateQueries
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
