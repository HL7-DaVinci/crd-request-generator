import React, { memo, useState, useEffect } from 'react';
import useStyles from './styles';
import DashboardElement from './DashboardElement';
const Dashboard = (props) => {
  const classes = useStyles();
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("Loading...")
  const addResources = (bundle)=>{
      if(bundle.entry){
          bundle.entry.forEach((e) => {
            const resource = e.resource;
            if(resource.status === 'in-progress'){
                setResources(resources => [...resources, resource])
            }
          }) 
      }
  }
  useEffect(() => {
    if(props.client.patient.id) {
      props.client.patient.request('QuestionnaireResponse', {'pageLimit': 0, 'onPage': addResources}).then(() => {
        setMessage("No QuestionnaireResponses Found for user with patientId: " + props.client.patient.id);
      });
    } else {
      setMessage("Invalid patient: No patientId provided")
    }

  }, [props.client.patient])

  return (
    <div className={classes.dashboardArea}>
        {resources.length > 0?
        resources.map((e) => {
          return <DashboardElement key = {e.id} resource = {e} client={props.client}/>
        }): <div>{message}</div>}
    </div>
  );
};

export default memo(Dashboard);
