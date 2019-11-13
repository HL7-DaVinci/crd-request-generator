import React, {Component} from 'react';
import PatientBox from './PatientBox';
import './smart.css';
export default class SMARTBox extends Component {
    constructor(props){
        super(props);
        this.state={
            minimized: false
        };

        this.minimizeSmart = this.minimizeSmart.bind(this);
    }

    minimizeSmart(){
        this.setState({"minimized":!this.state.minimized})
    }


    render() {
        return (
            <div>
                <div>

                    <div className="smartBox">
                        <div className="smartHeader">
                            <button 
                            className="smartExit"
                            onClick={this.props.exitSmart}>X</button>
                        </div>
                        {this.props.children}
                    </div>
                </div>
            </div>

        )
    }
}