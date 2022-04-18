import React, { Component } from "react";
import FHIR from "fhirclient";
import SMARTBox from "../SMARTBox/SMARTBox";
import PatientBox from "../SMARTBox/PatientBox";
import { defaultValues, shortNameMap } from "../../util/data";
import { getAge } from "../../util/fhir";
import _ from "lodash";
import "./request.css";
import { PrefetchTemplate } from "../../PrefetchTemplate";

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
      serviceRequest: {},
      medicationRequest: {},
      medicationDispense: {},
      gatherCount: 0
    };

    this.renderRequestResources = this.renderRequestResources.bind(this);
    this.renderPatientInfo = this.renderPatientInfo.bind(this);
    this.renderOtherInfo = this.renderOtherInfo.bind(this);
    this.renderResource = this.renderResource.bind(this);
    this.renderPrefetchedResources = this.renderPrefetchedResources.bind(this);
    this.renderError = this.renderError.bind(this);
  }

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
    this.props.submitInfo(prefetch, request, this.state.patient, null, "order-sign");
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
        request,
        ...this.state.prefetchedResources,
      ];

      return this.wrapPrefetchItems(resources);

    } else if (resourceType === "MEDICATIONDISPENSE") {

      const medicationDispenseResources = [
        this.state.patient,
        request,
        this.state.practitioner,
        ...this.state.prefetchedResources,
      ];
      return this.wrapPrefetchItems(medicationDispenseResources);
    }
  }

  submit = () => {
    if (!_.isEmpty(this.state.deviceRequest)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.deviceRequest),
        this.state.deviceRequest,
        this.state.patient,
        null,
        "order-sign"
      );
    } else if (!_.isEmpty(this.state.serviceRequest)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.serviceRequest),
        this.state.serviceRequest,
        this.state.patient,
        null,
        "order-sign"
      );
    } else if (!_.isEmpty(this.state.medicationRequest)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.medicationRequest),
        this.state.medicationRequest,
        this.state.patient,
        null,
        "order-sign"
      );
    } else if (!_.isEmpty(this.state.medicationDispense)) {
      this.props.submitInfo(
        this.makePrefetch(this.state.medicationDispense),
        this.state.medicationDispense,
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
      prefetchedResources: [],
      practitioner: {},
      deviceRequest: {},
      coverage: {},
      serviceRequest: {},
      medicationRequest: {},
      medicationDispense: {}
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

  render() {
    const params = {};
    params['serverUrl'] = this.props.ehrUrl;
    if (this.props.access_token) {
        params['tokenResponse'] = {access_token: this.props.access_token.access_token};
    }
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
        <button className={"submit-btn btn btn-class "} onClick={this.submit}>
          Submit
        </button>
      </div>
    );
  }
}
