import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
import { StatisticValue } from 'semantic-ui-react';
export default class SettingsBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            headers: []
        };

        this.updateCB = this.updateCB.bind(this);
    }

    componentDidMount(){
        this.setState({headers:this.props.headers})
    }

    updateCB(elementName, value) {
        this.props.updateCB(elementName, value);
        console.log(value);
        console.log(elementName);

        this.setState(prevState => ({
                ...prevState,
                headers: {
                    ...prevState.headers,
                    [elementName]:{
                        ...prevState.headers[elementName],
                        value: {
                            ...prevState.headers[elementName].value,
                            [this.props.version]: value
                        }
                    }
                }
            }
            ))
    }

    render() {
        const headers = this.state.headers;

        return (
            <div>
                {Object.keys(headers).map((header)=>{
                    let value = headers[header].value[this.props.version];
                    return <div key={header}>
                        <p className="setting-header">{headers[header].display}</p>
                        <InputBox 
                            extraClass = "skadingle"
                            value = {value}
                            updateCB = {this.updateCB}
                            elementName = {header}/>
                    </div>

                })}



            </div>

        )
    }
}