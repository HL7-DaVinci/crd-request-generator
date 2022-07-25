import React, { memo, useCallback, useState, useEffect } from 'react';
import { TextField, Button } from '@material-ui/core';
import axios from 'axios';

import useStyles from './styles';
import DashboardElement from './DashboardElement';
import { client } from 'fhirclient';
const Dashboard = (props) => {
  const classes = useStyles();
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("Loading...")
  const addResources = useCallback((bundle)=>{
      if(bundle.entry){
          bundle.entry.forEach((e) => {
            const resource = e.resource;
            if(resource.status === 'in-progress'){
                setResources(resources => [...resources, resource])
            }
          }) 
      }
  })
  useEffect(() => {
    props.client.patient.request('QuestionnaireResponse', {'pageLimit': 0, 'onPage': addResources}).then(() => {
      setMessage("No QuestionnaireResponses Found for user with patientId: " + props.client.patient.id);
    });
  }, [])

  return (
    <div className={classes.dashboardArea}>
        {resources.length > 0?
        resources.map((e) => {
          return <DashboardElement key = {e.id} resource = {e}/>
        }): <div>{message}</div>}
    </div>
  );
};

export default memo(Dashboard);
