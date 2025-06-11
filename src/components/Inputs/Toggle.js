import React, {Component} from 'react';
import { Button, ButtonGroup } from '@mui/material';

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
        const isOption1Selected = this.props.value == this.props.options.option1.value;
        const isOption2Selected = this.props.value == this.props.options.option2.value;
        
        return (
            <ButtonGroup variant="outlined" sx={{ width: '100%' }}>
                <Button 
                    onClick={this.clickedOption1} 
                    variant={isOption1Selected ? "contained" : "outlined"}
                    sx={{ 
                        flex: 1,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        backgroundColor: isOption1Selected ? 'primary.main' : 'transparent'
                    }}
                >
                    {this.props.options.option1.text}
                </Button>
                <Button 
                    onClick={this.clickedOption2} 
                    variant={isOption2Selected ? "contained" : "outlined"}
                    sx={{ 
                        flex: 1,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        backgroundColor: isOption2Selected ? 'primary.main' : 'transparent'
                    }}
                >
                    {this.props.options.option2.text}
                </Button>
            </ButtonGroup>
        )

    }
}
