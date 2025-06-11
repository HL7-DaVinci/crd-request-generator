import React, {Component} from 'react';
import { Autocomplete, TextField } from '@mui/material';
import {stateOptions} from '../../util/data.js'

export default class DropdownState extends Component {
  constructor(props){
    super(props);
    this.state = { currentValue: "MA"}
  };

  handleChange = (event, newValue) => {
    if (newValue) {
      this.props.updateCB(this.props.elementName, newValue.value);
      this.setState({ currentValue: newValue.value });
    } else {
      this.props.updateCB(this.props.elementName, '');
      this.setState({ currentValue: '' });
    }
  }

  render() {
    const { currentValue } = this.props;
    const selectedOption = stateOptions.find(option => option.value === currentValue) || null;

    return (
      <Autocomplete
        value={selectedOption}
        onChange={this.handleChange}
        options={stateOptions}
        getOptionLabel={(option) => option.text || ''}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Choose State"
            variant="outlined"
            size="small"
            fullWidth
          />
        )}
        sx={{ mb: 1 }}
      />
    )
  }
}