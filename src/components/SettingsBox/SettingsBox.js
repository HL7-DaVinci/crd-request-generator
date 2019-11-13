import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
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
                    let value = headers[header].value[this.props.version];
                    return <div key={header}>
                        <p className="setting-header">{headers[header].display}</p>
                        <InputBox 
                            extraClass = "setting-input"
                            value = {value}
                            updateCB = {this.updateCB}
                            elementName = {header}/>
                    </div>

                })}



            </div>

        )
    }
}