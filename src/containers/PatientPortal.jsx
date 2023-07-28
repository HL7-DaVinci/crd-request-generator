import React, { memo, useState, useEffect } from 'react';
import useStyles from './styles/styles';
import FHIR from "fhirclient";
import Login from '../components/Auth/Login';
import Dashboard from '../components/Dashboard/Dashboard';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import env from 'env-var';

const PatientPortal = () => {
    const classes = useStyles();
    const [token, setToken] = useState(null);
    const [client, setClient] = useState(null);
    const [patientName, setPatientName] = useState(null);

    useEffect(() => {
        if(token) {
            const data = JSON.parse(Buffer.from(token.split('.')[1], 'base64'))
            const client = FHIR.client({
                serverUrl: env.get('REACT_APP_EHR_BASE').asString(),
                tokenResponse: {
                    type: 'bearer',
                    access_token: token,
                    patient: data.patientId
                },
            });
            client.request(`Patient/${client.patient.id}`).then((patient) => {
                setPatientName(getName(patient));
            });
            setClient(client);
        }

      }, [token])

    const getName = (patient) => {
        const name = [];
        if(patient.name) {
            if(patient.name[0].given) {
                name.push(patient.name[0].given[0]);
            }
            if(patient.name[0].family){
                name.push(patient.name[0].family);
            }
        }
        return name.join(' ');
    }
    return (
        <div className={classes.background}>
            <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: '#bb3551', height:'95px'}}>
                <Toolbar>
                <Typography variant="h5" noWrap component="div" sx={{lineHeight: '95px'}}>
                    <strong>EHR</strong> Patient Portal
                </Typography>
                {patientName ? 
                                <span className={classes.loginIcon}>
                                    <AccountBoxIcon  sx={{ fontSize: 60, verticalAlign: 'middle'}}/> {patientName}
                                </span>
                                :
                                null
                }
                </Toolbar>
            </AppBar>
                {token && client ?
                    <Dashboard client={client}></Dashboard>
                    :
                    <Login tokenCallback={setToken}></Login>
                }
        </div>
    );
};

export default memo(PatientPortal);
