import React, { Component } from "react";
import FHIR from "fhirclient";
import SMARTBox from "../SMARTBox/SMARTBox";
import PatientBox from "../SMARTBox/PatientBox";
import CheckBox from '../Inputs/CheckBox';
import { types, defaultValues, shortNameMap } from "../../util/data";
import { getAge } from "../../util/fhir";
import _ from "lodash";
import "./request.css";
import { PrefetchTemplate } from "../../PrefetchTemplate";
import { retrieveLaunchContext } from "../../util/util";
import { Message } from "semantic-ui-react";

export default class RequestBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openPatient: false,
      patientList: [],
      patient: {},
      prefetchedResources: new Map(),
      codeValues: defaultValues,
      code: null,
      codeSystem: null,
      display: null,
      request: {},
      gatherCount: 0,
      response: {},
      deidentifyRecords: false
    };

    this.renderRequestResources = this.renderRequestResources.bind(this);
    this.renderPatientInfo = this.renderPatientInfo.bind(this);
    this.renderOtherInfo = this.renderOtherInfo.bind(this);
    this.renderResource = this.renderResource.bind(this);
    this.renderPrefetchedResources = this.renderPrefetchedResources.bind(this);
    this.renderError = this.renderError.bind(this);
    this.buildLaunchLink = this.buildLaunchLink.bind(this);
    this.buildNewRxRequest = this.buildNewRxRequest.bind(this);
    this.updateDeidentifyCheckbox = this.updateDeidentifyCheckbox.bind(this);
    this.xmlAddTextNode = this.xmlAddTextNode.bind(this);
  }

  // TODO - see how to submit response for alternative therapy
  replaceRequestAndSubmit(request) {
    console.log("replaceRequestAndSubmit: " + request.resourceType);
    this.setState({ request: request });
    // Prepare the prefetch.
    const prefetch = this.prepPrefetch();
    // Submit the CRD request.
    this.props.submitInfo(prefetch, request, this.state.patient, "order-sign", this.state.deidentifyRecords);
  }

  componentDidMount() {}

  exitSmart = () => {
    this.setState({ openPatient: false });
  };

  prepPrefetch() {
    const preppedResources = new Map();
    Object.keys(this.state.prefetchedResources).forEach((resourceKey) => {
      let resourceList = []
      if(Array.isArray(this.state.prefetchedResources[resourceKey])){
        resourceList = this.state.prefetchedResources[resourceKey].map((resource) => {
          return resource;
        })
      } else {
        resourceList = this.state.prefetchedResources[resourceKey]
      }

      preppedResources.set(resourceKey, resourceList);
    });
    return preppedResources;
  }

  submit = () => {
    if (!_.isEmpty(this.state.request)) {
      this.props.submitInfo(
        this.prepPrefetch(),
        this.state.request,
        this.state.patient,
        "order-sign",
        this.state.deidentifyRecords
      );
    }
  };

  updateStateElement = (elementName, text) => {
    this.setState({ [elementName]: text });
  };

  updateStateList = (elementName, text) => {
    this.setState((prevState) => {
      return {[elementName]: [...prevState[elementName], text]}
    });
  };

  updateStateMap = (elementName, key, text) => {
    this.setState((prevState) => {
      if(!prevState[elementName][key]){
        prevState[elementName][key] = [];
      }
      return {[elementName]: {...prevState[elementName], [key]: text}};
    });
  };

  clearState = () => {
    this.setState({
      prefetchedResources: new Map(),
      practitioner: {},
      coverage: {},
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
    const prefetchMap = new Map(Object.entries(this.state.prefetchedResources));
    if (prefetchMap.size > 0) {
      return this.renderRequestResources(prefetchMap);
    }
  }

  renderRequestResources(requestResources) {
    var renderedPrefetches = new Map();
    requestResources.forEach((resourceList, resourceKey) => {
      const renderedList = [];
      if(Array.isArray(resourceList)){
        resourceList.forEach((resource) => {
          console.log("Request resources:" + JSON.stringify(requestResources));
          console.log("Request key:" + resourceKey);
          renderedList.push(this.renderResource(resource))
        });
      } else {
        renderedList.push(this.renderResource(resourceList))
      }

      renderedPrefetches.set(resourceKey, renderedList);
    });
    console.log(renderedPrefetches);
    console.log(Object.entries(renderedPrefetches));
    return (
      <div className="prefetched">
        <div className="prefetch-header">Prefetched</div>
        {Array.from(renderedPrefetches.keys()).map((resourceKey) => {
          const currentRenderedPrefetch = renderedPrefetches.get(resourceKey);
          return (<div key = {resourceKey}><div className="prefetch-subheader">{resourceKey + " Resources"}</div>
            {currentRenderedPrefetch}</div>);
        })}
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
      if (Object.keys(this.state.request).length > 0) {
        order = `${this.state.request.resourceType}/${this.state.request.id}`;
        if (this.state.request.insurance && this.state.request.insurance.length > 0) {
          coverage = `${this.state.request.insurance[0].reference}`;
        }
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
   
    return retrieveLaunchContext(
      linkCopy, this.props.fhirAccessToken,
        this.state.patient.id, this.props.fhirServerUrl, this.props.fhirVersion
    ).then((result) => {
        linkCopy = result;
        return linkCopy;
    });
  }

  /**
   * Send the NewRxRequestMessage to the Pharmacy Information System (PIMS)
   */
  sendRx = (e) => {
    console.log("sendRx: " + this.props.pimsUrl);

    // build the NewRx Message
    var newRx = this.buildNewRxRequest();
    console.log(newRx);
    const serializer = new XMLSerializer();
    
    // send the message to the prescriber
    this.props.consoleLog("Sending Rx to PIMS", types.info);
    fetch(this.props.pimsUrl, {
      method: 'POST',
      //mode: 'no-cors',
      headers: {
        'Accept': 'application/xml',
        'Content-Type': 'application/xml'
      },
      body: serializer.serializeToString(newRx)
    })
    .then(response => {
      console.log("sendRx response: ");
      console.log(response);
      this.props.consoleLog("Successfully sent Rx to PIMS", types.info);
    })
    .catch(error => {
      console.log("sendRx error: ");
      this.props.consoleLog("Server returned error sending Rx to PIMS: ", types.error);
      this.props.consoleLog(error.message);
      console.log(error);
    });

  }


  resetRemsAdmin = (e) => {
    console.log("reset rems admin: " + "localhost:8090/etasu/reset");

    fetch("localhost:8090/etasu/reset", {
      method: 'POST',
    })
    .then(response => {
      console.log("Reset rems admin etasy: ");
      console.log(response);
      this.props.consoleLog("Successfully reset rems admin etasu", types.info);
    })
    .catch(error => {
      console.log("Reset rems admin error: ");
      this.props.consoleLog("Server returned error when resetting rems admin etasu: ", types.error);
      this.props.consoleLog(error.message);
      console.log(error);
    });

  }

  xmlAddTextNode(xmlDoc, parent, sectionName, value) {
    var section = xmlDoc.createElement(sectionName);
    var textNode = xmlDoc.createTextNode(value);
    section.appendChild(textNode);
    parent.appendChild(section);
  }

  buildNewRxRequest() {
    var doc = document.implementation.createDocument("", "", null);
    var message = doc.createElement("Message");

    // Header
    var header = doc.createElement("Header");
    // generate the message id (just get the milliseconds since epoch and use that)
    const d1 = new Date();
    const messageIdValue = d1.getTime();
    // console.log(messageIdValue);
    this.xmlAddTextNode(doc, header, "MessageID", messageIdValue);
    message.appendChild(header);

    // Body
    var body = doc.createElement("Body");
    var newRx = doc.createElement("NewRx");

    //   Patient
    const patientResource = this.state.prefetchedResources.patient;
    var patient = doc.createElement("Patient");
    var humanPatient = doc.createElement("HumanPatient");

    //     Patient Name
    var patientNames = doc.createElement("Names");
    var patientName = doc.createElement("Name");
    this.xmlAddTextNode(doc, patientName, "LastName", patientResource.name[0].family);
    this.xmlAddTextNode(doc, patientName, "FirstName", patientResource.name[0].given[0]);
    patientNames.appendChild(patientName);
    humanPatient.appendChild(patientNames);

    //     Patient Birth Date
    var dateOfBirth = doc.createElement("DateOfBirth");
    this.xmlAddTextNode(doc, dateOfBirth, "Date", patientResource.birthDate);
    humanPatient.appendChild(dateOfBirth);
    patient.appendChild(humanPatient);
    newRx.appendChild(patient);

    //   Prescriber
    const practitionerResource = this.state.prefetchedResources.practitioner;
    // console.log(practitionerResource);
    var prescriber = doc.createElement("Prescriber");
    var nonVeterinarian = doc.createElement("NonVeterinarian");

    //     Prescriber Identifier
    for (let i = 0; i < practitionerResource.identifier.length; i++) {
      let id = practitionerResource.identifier[i];
      if ((id.system) && (id.system.includes("us-npi"))) {
        var identification = doc.createElement("Identification");
        this.xmlAddTextNode(doc, identification, "NPI", id.value);
        nonVeterinarian.appendChild(identification);
      }
    }

    //     Prescriber Name
    var prescriberNames = doc.createElement("Names");
    var prescriberName = doc.createElement("Name");
    this.xmlAddTextNode(doc, prescriberName, "LastName", practitionerResource.name[0].family);
    this.xmlAddTextNode(doc, prescriberName, "FirstName", practitionerResource.name[0].given[0]);
    prescriberNames.appendChild(prescriberName);
    nonVeterinarian.appendChild(prescriberNames);

    //     Prescriber Address
    const practitionerAddress = practitionerResource.address[0];
    var address = doc.createElement("Address");
    this.xmlAddTextNode(doc, address, "AddressLine1", practitionerAddress.line[0]);
    this.xmlAddTextNode(doc, address, "City", practitionerAddress.city);
    this.xmlAddTextNode(doc, address, "StateProvince", practitionerAddress.state);
    this.xmlAddTextNode(doc, address, "PostalCode", practitionerAddress.postalCode);
    this.xmlAddTextNode(doc, address, "Country", "US"); // assume US for now
    nonVeterinarian.appendChild(address);

    //     Prescriber Phone Number and Email
    var communicationNumbers = doc.createElement("CommunicationNumbers");
    for (let i = 0; i < practitionerResource.telecom.length; i++) {
      const telecom = practitionerResource.telecom[i];
      if (telecom.system == "phone") {
        var primaryTelephone = doc.createElement("PrimaryTelephone");
        this.xmlAddTextNode(doc, primaryTelephone, "Number", telecom.value);
        communicationNumbers.appendChild(primaryTelephone);
      } else if (telecom.system == "email") {
        this.xmlAddTextNode(doc, communicationNumbers, "ElectronicMail", telecom.value);
      }
    }
    nonVeterinarian.appendChild(communicationNumbers)

    prescriber.appendChild(nonVeterinarian);
    newRx.appendChild(prescriber);

    //   Medication
    const medicationRequestResource = this.state.request;
    // console.log(medicationRequestResource);
    var medicationPrescribed = doc.createElement("MedicationPrescribed");


    //     Medication Drug Description
    const coding = medicationRequestResource.medicationCodeableConcept.coding[0];
    this.xmlAddTextNode(doc, medicationPrescribed, "DrugDescription", coding.display);

    //     Medication Product
    var product = doc.createElement("Product");
    var drugCoded = doc.createElement("DrugCoded");
    var productCode = doc.createElement("ProductCode");
    this.xmlAddTextNode(doc, productCode, "Code", coding.code);
    this.xmlAddTextNode(doc, productCode, "Qualifier", coding.system);
    drugCoded.appendChild(productCode);
    product.appendChild(drugCoded);
    medicationPrescribed.appendChild(product);

    //     Medication Quantity
    var quantity = doc.createElement("Quantity");
    this.xmlAddTextNode(doc, quantity, "Value", medicationRequestResource.dispenseRequest.quantity.value);
    medicationPrescribed.appendChild(quantity);

    newRx.appendChild(medicationPrescribed);

    body.appendChild(newRx);
    message.appendChild(body);

    doc.appendChild(message);

    return doc;
  }

  isOrderNotSelected() {
    return Object.keys(this.state.request).length === 0;
  }

  updateDeidentifyCheckbox(elementName, value) {
    this.setState({ deidentifyRecords: value });
  }

  render() {
    const params = {};
    params['serverUrl'] = this.props.ehrUrl;
    if (this.props.access_token) {
        params['tokenResponse'] = {access_token: this.props.access_token.access_token};
    }
    const disableSendToCRD = this.isOrderNotSelected() || this.props.loading ;
    const disableLaunchDTR = this.isOrderNotSelected() && Object.keys(this.state.response).length === 0;
    const disableSendRx = this.isOrderNotSelected() || this.props.loading;
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
                            callbackMap={this.updateStateMap}
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
            <div>
              <b>Deidentify Records</b>
              <CheckBox
                toggle = {this.state.deidentifyRecords}
                updateCB={this.updateDeidentifyCheckbox}
                elementName = "deidentifyCheckbox" 
                />
            </div>
          </div>
        </div>
        <div id="fse" className={"spinner " + (this.props.loading ? "visible" : "invisible")}>
          <div className="ui active right inline loader"></div>
        </div> 
        <button className={"submit-btn btn btn-class "} onClick={this.sendRx} disabled={disableSendRx}>
          Send Rx to PIMS
        </button>
        <button className={"submit-btn btn btn-class "} onClick={this.relaunch} disabled={disableLaunchDTR}>
          Relaunch DTR
        </button>
        <button className={"submit-btn btn btn-class "} onClick={this.submit} disabled={disableSendToCRD}>
          Submit to REMS-Admin
        </button>
        <button className={"submit-btn btn btn-class "} onClick={this.resetRemsAdmin} disabled={disableSendToCRD}>
          Reset REMS-Admin Database
        </button>
      </div>
    );
  }
}
