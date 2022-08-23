import React, { memo, useState, useEffect } from 'react';
import { retrieveLaunchContext } from '../../util/util';
import { headers } from '../../util/data.js';

import useStyles from './styles';
const DashboardElement = (props) => {
  const classes = useStyles();
  const resource = props.resource;
  const clientState = props.client.state;
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

  return (
    <div className = {classes.dashboardElement} onClick={relaunch}>
        <div>ID: {resource.id}</div>
        <div>Questionnaire: {resource.questionnaire}</div>
    </div>
  );
};

export default memo(DashboardElement);
