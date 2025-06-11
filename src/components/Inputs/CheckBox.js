import React, {Component} from 'react';
import { FormControlLabel, Switch } from '@mui/material';

export default class CheckBox extends Component {
    constructor(props){
        super(props);
        this.state={
            toggle: props.toggle
        };

    this.onInputChange = this.onInputChange.bind(this);

    }
    onInputChange(event){
        const newToggle = event.target.checked;
        this.setState({toggle: newToggle})
        this.props.updateCB(this.props.elementName, newToggle);
    }
    
    render() {
        return (
            <FormControlLabel
                control={
                    <Switch
                        checked={this.state.toggle}
                        onChange={this.onInputChange}
                        name={this.props.elementName}
                        className={this.props.extraClass}
                    />
                }
                label={this.props.displayName || ''}
            />
        )
    }
}
