import React, { memo, useState, useEffect } from 'react';
import useStyles from './styles/styles';
import FHIR from "fhirclient";
import config from '../properties.json';
import Login from '../components/Auth/Login';
import Dashboard from '../components/Dashboard/Dashboard';
const PatientPortal = () => {
    const classes = useStyles();
    const [token, setToken] = useState(null);
    const [client, setClient] = useState(null);

    useEffect(() => {
        if(token) {
            const data = JSON.parse(Buffer.from(token.split('.')[1], 'base64'))
            setClient(FHIR.client({
                serverUrl: config.ehr_base,
                tokenResponse: {
                    type: 'bearer',
                    access_token: token,
                    patient: data.patientId
                },
              }));
        }

      }, [token])


    return (
        <div className={classes.background}>

            <div className={classes.adminBar}>
                <span className={classes.adminBarText}>
                    <strong>REMS</strong> Patient Portal
                </span>
            </div>

                {token && client ?
                    <Dashboard client={client}></Dashboard>
                    :
                    <Login tokenCallback={setToken}></Login>
                }
        </div>
    );
};

export default memo(PatientPortal);
