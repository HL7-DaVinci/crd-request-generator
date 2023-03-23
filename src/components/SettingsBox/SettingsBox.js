import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
import CheckBox from '../Inputs/CheckBox';
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
                    let display = headers[header].display;
                    switch(type) {
                        case "input":
                            return <div key={header}>
                                <p className="setting-header">{display}</p>
                                <InputBox 
                                    extraClass = "setting-input"
                                    value = {value}
                                    updateCB = {this.updateCB}
                                    elementName = {header}/>
                            </div>
                        case "check":
                            return <div key={header}>
                                <p className="setting-header">{display}
                                <CheckBox
                                    extraClass = "setting-checkbox"
                                    extraInnerClass = "setting-inner-checkbox"
                                    toggle = {value}
                                    updateCB={this.updateCB}
                                    elementName = {header} />
                                    </p>
                                <p>&nbsp;</p>
                            </div>
                        case "button":
                            return <div key={header}>
                                <button className={"setting-btn btn btn-class"} onClick={value}>{display}</button>
                                </div>
                        case "spacer":
                            return <div key={header}><br></br></div>
                        case "line":
                            return <div key={header}><hr></hr></div>
                        default:
                            return <div key={header}><p className="setting-header">{display}</p></div>
                    }
                    
                })}
            </div>

        )
    }
}