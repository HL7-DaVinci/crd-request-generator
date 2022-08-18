import React, {Component} from 'react';
import { BrowserRouter as Router, Routes, Route}
    from 'react-router-dom';
import RequestBuilder from '../containers/RequestBuilder';
import PatientPortal from '../containers/PatientPortal';
import theme from '../containers/styles/theme';
import { ThemeProvider } from '@material-ui/core/styles';

export default class App extends Component {
    render() {
        return (
                <Router>
                    <Routes>
                        <Route path='/' exact element={<RequestBuilder />} />
                        
                        <Route exact path='/patient-portal' element={
                        <ThemeProvider theme={theme}>
                            <PatientPortal />
                        </ThemeProvider>} />

                    </Routes>
                </Router>
        );
    }
}