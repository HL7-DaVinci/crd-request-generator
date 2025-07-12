import React, {Component} from 'react';
import RequestBuilder from '../containers/RequestBuilder';
import { fetchRuntimeConfig } from '../util/runtime-config';

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            configLoaded: false,
            configError: null
        };
    }

    async componentDidMount() {
        try {
            await fetchRuntimeConfig();
            this.setState({ configLoaded: true });
        } catch (error) {
            console.error('Failed to load runtime configuration:', error);
            this.setState({ 
                configLoaded: true, 
                configError: 'Failed to load runtime configuration' 
            });
        }
    }

    render() {
        if (!this.state.configLoaded) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div>Loading...</div>
                </div>
            );
        }

        if (this.state.configError) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ color: 'orange' }}>
                        Warning: {this.state.configError}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        Using default configuration...
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <RequestBuilder />
                    </div>
                </div>
            );
        }

        return (
            <div>
                <RequestBuilder />
            </div>
        );
    }
}