import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react';
import {stateOptions} from '../../util/data.js'



let blackBorder = "blackBorder";

export default class DropdownState extends Component {
  constructor(props){
    super(props);
    this.state = { currentValue: "MA"}
  };

  handleChange = (e, { value }) => {
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  render() {
    const { currentValue } = this.props;
    if(currentValue){
        blackBorder = "blackBorder";
    }else{
        blackBorder = "";
    }
    return (
      <Dropdown
      className={blackBorder}
        options={stateOptions}
        placeholder='Choose State'
        search
        selection
        fluid
        onChange={this.handleChange}
        value={currentValue}
      />
    )
  }
}