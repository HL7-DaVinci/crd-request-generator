import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
import CheckBox from '../Inputs/CheckBox';
import { Typography, Box } from '@mui/material';
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
    }    render() {
        const headers = this.props.headers;

        return (
            <Box>
                {Object.keys(headers).map((header)=>{
                    let value = headers[header].value;
                    let type = headers[header].type;
                    switch(type) {
                        case "input":
                            return <Box key={header} sx={{ mb: 2 }}>
                                <Typography variant="body2" className="setting-header" sx={{ mb: 1, fontWeight: 'medium' }}>
                                    {headers[header].display}
                                </Typography>
                                <InputBox 
                                    extraClass = "setting-input"
                                    value = {value}
                                    updateCB = {this.updateCB}
                                    elementName = {header}/>
                            </Box>
                        case "check":
                            return <Box key={header} sx={{ mb: 2 }}>
                                <Typography variant="body2" className="setting-header" sx={{ mb: 1, fontWeight: 'medium' }}>
                                    {headers[header].display}
                                </Typography>
                                <CheckBox
                                    extraClass = "setting-checkbox"
                                    extraInnerClass = "setting-inner-checkbox"
                                    toggle = {value}
                                    updateCB={this.updateCB}
                                    elementName = {header}
                                    displayName = ""
                                />
                            </Box>
                        default:
                            return <Box key={header} sx={{ mb: 2 }}>
                                <Typography variant="body2" className="setting-header" sx={{ fontWeight: 'medium' }}>
                                    {headers[header].display}
                                </Typography>
                            </Box>
                    }
                    
                })}
            </Box>

        )
    }
}