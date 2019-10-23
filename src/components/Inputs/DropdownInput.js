import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react';

let blackBorder = "blackBorder";

export default class DropdownInput extends Component {
  constructor(props){
    super(props);
    this.state = {}
  };

  handleAddition = (e, { value }) => {
    this.props.updateCB(
      "codeValues", [{ text: value, value }, ...this.props.options] )
  }

  dropDownOptions(options) {
    return options.map((v) => {return {key: v.key, text: `${v.key} - ${v.value}`, value: v.value}})
  }

  handleChange = (e, { value }) => {
    this.props.updateCB(this.props.elementName, value)
    this.props.updateCB('codeSystem', this.props.options.find((v) => v.value === value).codeSystem)
    this.setState({ currentValue: value })
  }


  render() {
    const { currentValue, options } = this.props
    if(currentValue){
        blackBorder = "blackBorder";
    }else{
        blackBorder = "";
    }
    return (
      <Dropdown
      className={"dropdownCode " +blackBorder}
        options={this.dropDownOptions(options)}
        placeholder='Choose Code'
        search
        selection
        fluid
        allowAdditions
        value={currentValue}
        onAddItem={this.handleAddition}
        onChange={this.handleChange}
      />
    )
  }
}
