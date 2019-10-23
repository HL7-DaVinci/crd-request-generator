import React, { Component } from 'react';
import FHIR from "fhirclient"
import SMARTBox from '../SMARTBox/SMARTBox';
import PatientBox from '../SMARTBox/PatientBox';
import {defaultValues} from '../../util/data';
import './request.css';
export default class RequestBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            access_token: "",
            patientList: [],
            patient: {"id":"N/A"},
            deviceRequests: {},
            codeValues: defaultValues,
        };
    }

    componentDidMount(){

    }

    updateStateElement = (elementName, text) => {
        this.setState({ [elementName]: text });
    }

    getDeviceRequest(patientId, client) {
        client.request(`DeviceRequest?subject=Patient/${patientId}`,
                        {resolveReferences:["subject","performer"], 
                        graph: false,
                        flat: true})
                        .then((result)=>{
                            console.log(result);
                            this.setState(prevState=>({
                                deviceRequests: {
                                    ...prevState.deviceRequests,
                                    [patientId]: result
                                }
                            }));
                        });
    }

    getPatients = () => {
        this.setState({openPatient:true});
        const client = FHIR.client({
            serverUrl: this.props.ehrUrl,
            tokenResponse: {
                access_token: this.state.access_token
            }
        });
        client.request("Patient",{flat:true}).then((result)=>{
            this.setState({
                patientList: result
            });
            result.map((e)=>{
                this.getDeviceRequest(e.id, client);
            });
        });
    }

    render() {

        return (
            <div className = "request">
                {this.state.openPatient?<div>
                            <SMARTBox exitSmart={this.exitSmart}>
                                {this.state.patientList.map((patient)=>{
                                    return <PatientBox
                                    key = {patient.id}
                                    patient = {patient}
                                    deviceRequests = {this.state.deviceRequests[patient.id]}
                                    callback={this.updateStateElement}
                                    ehrUrl={this.props.ehrUrl}
                                    options={this.state.codeValues}
                                    />
                                })}

                            </SMARTBox>
                </div>:""}
                <button className="select-button" onClick={this.getPatients}>Patient Select:</button>
                <div className = "request-header">{this.state.patient.id}</div>
            </div>

        )
    }
}