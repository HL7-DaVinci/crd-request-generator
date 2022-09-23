import React, { memo, useState, useEffect } from 'react';
import { retrieveLaunchContext } from '../../util/util';
import { headers } from '../../util/data.js';
import { Paper } from '@material-ui/core';
import useStyles from './styles';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
const DashboardElement = (props) => {
  const classes = useStyles();
  const resource = props.resource;
  const clientState = props.client.state;
  const status = props.status;
  const date = new Date(resource.meta.lastUpdated).toUTCString();
  const [questionnaireId] = resource.questionnaire.split('/').slice(-1);
  const splitCamelCaseWithAbbreviations = (s) =>{
    return s.split(/([A-Z][a-z]+)/).filter(function(e){return e});
 }
  
  const relaunch = () => {
    const link = {
      appContext: encodeURIComponent(`response=QuestionnaireResponse/${resource.id}`),
      type: "smart",
      url: headers.launchUrl.value
    }
    retrieveLaunchContext(link, clientState.tokenResponse.accessToken, clientState.tokenResponse.patient, clientState.serverUrl, 'r4').then((e) => {
      window.open(e.url, "_blank");
    })
  }
  const renderStatus = () => {
    let bColor = {};
    if(status === 'in-progress') {
      bColor = {backgroundColor: '#fdbe14'};
    } else if(status === 'completed') {
      bColor = {backgroundColor: '#20c997'};
    }
    return (
      <div style = {bColor} className = {classes.progressBubble} ></div>
    )
  }
  return (
    <div onClick={relaunch}>
      <Paper className = {classes.dashboardElement}>
        {renderStatus()}
        <div>
          <CalendarTodayIcon className = {classes.elementIcon}/> <strong>Last Updated</strong>: <span> {date}</span>
        </div>
        <div>
          <AssignmentIcon className = {classes.elementIcon}/> <strong> Questionnaire</strong>: {splitCamelCaseWithAbbreviations(questionnaireId).join(' ')}
          </div>
      </Paper>

    </div>
  );
};

export default memo(DashboardElement);
