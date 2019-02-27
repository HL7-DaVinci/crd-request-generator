import React, {Component} from 'react';
import './smart.css';
export default class SMARTBox extends Component {
    constructor(props){
        super(props);
        this.state={
            minimized: true
        };

        this.minimizeSmart = this.minimizeSmart.bind(this);
    }

    minimizeSmart(){
        this.setState({"minimized":!this.state.minimized})
    }


    render() {

        return (
            <div>
                {this.props.link?this.state.minimized?
                            <div className="smartBox">
                            <div className="smartHeader">
                            <button 
                            className="smartExit"
                            onClick={this.props.exitSmart}>X</button>
                            <button 
                            className="smartMinimize"
                            onClick={this.minimizeSmart}>-</button>
                            </div>
                            
                            <iframe src={this.props.link}></iframe>

                            </div>
                            :
                            <div>
                                <a 
                                onClick={this.minimizeSmart}
                                className="minimizedFrame">Smart App</a>
                            </div>
                            :
                            ""
            }
            </div>

        )
    }
}