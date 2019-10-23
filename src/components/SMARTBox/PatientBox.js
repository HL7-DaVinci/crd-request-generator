import React, {Component} from 'react';
import {fhir} from '../../util/fhir';
import './smart.css';
export default class SMARTBox extends Component {
    constructor(props){
        super(props);
        this.state={
            deviceRequest: "none"
        };

        this.handleChange = this.handleChange.bind(this);
    }

    getAge(dateString) {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    makeOption(request) {
        const a = request.codeCodeableConcept.coding[0].code;
        return <option value={JSON.stringify(request)} key={request.id} label={a}>{a}</option>
    }

    handleChange(e){
        console.log(e.target.value);
        this.setState({deviceRequest:e.target.value});
      }

    render() {
        const patient = this.props.patient;
        const text = "{ }";
        let name = "";
        if(patient.name){
            name = <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>
        }
        return (
            <div>

                    <div className="patient-selection-box" key={patient.id} onClick={()=>{
                        this.props.callback("patient", patient);
                        this.props.callback("openPatient",false);
                        this.props.callback("age",this.getAge(patient.birthDate));
                        this.props.callback("gender", patient.gender);
                        if(this.state.deviceRequest!=="none") {
                            const devR = JSON.parse(this.state.deviceRequest);
                            const code = devR.codeCodeableConcept.coding[0].code;
                            const system = devR.codeCodeableConcept.coding[0].system;
                            let text = "Unknown";
                            if(devR.codeCodeableConcept.coding[0].display){
                                text = devR.codeCodeableConcept.coding[0].display;
                            }
                            this.props.callback("code",code)
                            this.props.callback("codeSystem", system)
                            console.log(devR);
                            if(this.props.options.filter((e)=>{ return e.value===code && e.codeSystem===system }).length===0) {
                                console.log(this.props.options.filter((e)=>{ console.log(e); console.log(code); return e.value===code && e.codeSystem===system }))
                                this.props.callback("codeValues", [{ key: text, codeSystem: system, value: code }, ...this.props.options])
                            }
                            if(patient.address && patient.address[0].state) {
                                this.props.callback("patientState", patient.address[0].state)
                            } else {
                                this.props.callback("patientState", "")

                            }

                            if(devR.performer) {
                                if(devR.performer.reference) {
                                    fetch(`${this.props.ehrUrl}${devR.performer.reference}`, {
                                        method: "GET",
                                    }).then(response => {
                                        return response.json();
                                    }).then(json =>{
                                        if(json.address && json.address[0].state) {
                                            this.props.callback("practitionerState", json.address[0].state)
                                        }else {
                                            this.props.callback("practitionerState", "")
                                        }
            
                                    });
                                }
                            } else {
                                this.props.callback("practitionerState", "")
                            }


                        }

                    }}>
                        <div className="patient-info">
                            <span style={{fontWeight:"bold"}}>ID</span>: {patient.id}
                            {/* <a className="more-info">
                                {text}
                            </a> */}
                            <div><span style={{fontWeight:"bold"}}>Name</span>: {name?name:"N/A"}</div>
                            <div><span style={{fontWeight:"bold"}}>Gender</span>: {patient.gender}</div>
                            <div><span style={{fontWeight:"bold"}}>Age</span>: {this.getAge(patient.birthDate)}</div>
                        </div>
                        <div className="request-info">
                            <span style={{fontWeight:"bold",marginRight:"5px"}}>Device Request:</span>
                            <select value = {this.state.deviceRequest} onChange={this.handleChange} onClick={(event)=>{event.stopPropagation()}} className="request-selector">
                                {this.props.deviceRequests?
                                    this.props.deviceRequests.data.map((e)=>{return this.makeOption(e)}):null}
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