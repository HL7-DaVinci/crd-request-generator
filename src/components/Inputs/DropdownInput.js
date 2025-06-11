import React, {Component} from 'react';
import { Autocomplete, TextField } from '@mui/material';

export default class DropdownInput extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentValue: props.currentValue || null
    }
  };

  handleAddition = (newValue) => {
    const newOption = { key: newValue, value: newValue, text: newValue };
    this.props.updateCB("codeValues", [newOption, ...this.props.options]);
  }

  dropDownOptions(options) {
    return options.map((v) => ({
      key: v.key, 
      label: `${v.key} - ${v.value}`, 
      value: v.value,
      codeSystem: v.codeSystem
    }))
  }

  handleChange = (event, newValue) => {
    if (newValue) {
      this.props.updateCB(this.props.elementName, newValue.value);
      if (newValue.codeSystem) {
        this.props.updateCB('codeSystem', newValue.codeSystem);
      }
      this.setState({ currentValue: newValue.value });
    } else {
      this.props.updateCB(this.props.elementName, '');
      this.setState({ currentValue: null });
    }
  }

  render() {
    const { currentValue, options } = this.props;
    const dropdownOptions = this.dropDownOptions(options);
    const selectedOption = dropdownOptions.find(option => option.value === currentValue) || null;

    return (
      <Autocomplete
        value={selectedOption}
        onChange={this.handleChange}
        options={dropdownOptions}
        getOptionLabel={(option) => option.label || ''}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        freeSolo
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Choose Code"
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
