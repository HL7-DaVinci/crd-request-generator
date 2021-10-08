import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
import CheckBox from '../Inputs/CheckBox';
import { StatisticValue } from 'semantic-ui-react';
export default class SettingsBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };

        this.updateCB = this.updateCB.bind(this);
    }

    componentDidMount(){

    }

    updateCB(elementName, value) {
        this.props.updateCB(elementName, value);
    }

    render() {
        const headers = this.props.headers;

        return (
            <div>
                {Object.keys(headers).map((header)=>{
                    let value = headers[header].value;
                    let type = headers[header].type;
                    switch(type) {
                        case "input":
                            return <div key={header}>
                                <p className="setting-header">{headers[header].display}</p>
                                <InputBox 
                                    extraClass = "setting-input"
                                    value = {value}
                                    updateCB = {this.updateCB}
                                    elementName = {header}/>
                            </div>
                        case "check":
                            return <div key={header}>
                                <p className="setting-header">{headers[header].display}
                                <CheckBox
                                    extraClass = "setting-checkbox"
                                    extraInnerClass = "setting-inner-checkbox"
                                    toggle = {value}
                                    updateCB={this.updateCB}
                                    elementName = {header} />
                                    </p>
                                <p>&nbsp;</p>
                            </div>
                        default:
                            return <div key={header}><p className="setting-header">{headers[header].display}</p></div>
                    }
                    
                })}
            </div>

        )
    }
}