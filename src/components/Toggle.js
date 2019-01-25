import React, {Component} from 'react';
import { connect } from 'react-redux';


export default class Toggle extends Component {
    constructor(props){
        super(props);
        this.state={
            value: "",
            option1class: "genderBlockMaleUnselected",
            option2class: "genderBlockFemaleUnselected"
        };

    this.clickedOption1 = this.clickedOption1.bind(this);
    this.clickedOption2 = this.clickedOption2.bind(this);
    }
    clickedOption1(){
        if(this.props.value!==this.props.options.option1.value){
            this.props.updateCB(this.props.elementName, this.props.options.option1.value);
        }else{
            this.props.updateCB(this.props.elementName, "");
        }

    }
    clickedOption2(){
        if(this.props.value!==this.props.options.option2.value){
            this.props.updateCB(this.props.elementName, this.props.options.option2.value);
        }else{
            this.props.updateCB(this.props.elementName, "");
        }

    }
    render() {
        let option1class, option2class = "";
        if(this.props.value==this.props.options.option1.value) {
            option1class = "genderBlockMaleSelected";
            option2class = "genderBlockFemaleUnselected"
        }else if(this.props.value==this.props.options.option2.value){
            option1class = "genderBlockMaleUnselected";
            option2class = "genderBlockFemaleSelected";
        }else{
            option1class = "genderBlockMaleUnselected";
            option2class = "genderBlockFemaleUnselected";
        }
        return (
            <div>
            <div
            name={this.props.elementName}
            >
            <button onClick={this.clickedOption1} className={option1class+" genderBlockMale btn btn-class"}>{this.props.options.option1.text}</button>
            <button onClick={this.clickedOption2} className={option2class+" genderBlockFemale btn btn-class"}>{this.props.options.option2.text}</button>
            </div>
            </div>
        )

    }
}
