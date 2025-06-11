import React, {Component} from 'react';
import { TextField } from '@mui/material';

export default class InputBox extends Component {
    constructor(props){
        super(props);
        this.state={
            value: ""
        };

    this.onInputChange = this.onInputChange.bind(this);

    }
    onInputChange(event){
        this.setState({ value: event.target.value });
        this.props.updateCB(this.props.elementName, event.target.value);

    }
    render() {
        return (
            <TextField
                name={this.props.elementName}
                value={this.props.value}
                onChange={this.onInputChange}
                variant="outlined"
                size="small"
                fullWidth
                className={this.props.extraClass}
                sx={{ mb: 1 }}
            />
        )
    }
}