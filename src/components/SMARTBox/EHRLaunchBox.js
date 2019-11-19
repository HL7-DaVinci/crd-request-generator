import React, {Component} from 'react';
import {fhir} from '../../util/fhir';
import './smart.css';
export default class EHRLaunchBox extends Component {
    constructor(props){
        super(props);
        this.state={
        };
    }

    render() {
        return (
            <div>
                <div className="header">
                    EHR Launch Settings
                </div>
                <div>
                    <label className="ehr-setting">Select EHR: </label>
                    <select>
                        <option value="http://localhost:8080/ehr-server/">Local</option>
                    </select>
                    <div className="ehr-setting">
                        Note: Only the local EHR is supported at this time for EHR launch
                    </div>
                    <label className="ehr-setting">Username:</label>
                    <input></input>

                    <label className="ehr-setting">Password:</label>
                    <input type="password"></input>
                </div>
            </div>
        )
    }
}