import React, { memo } from 'react';

import useStyles from './styles';
const DashboardElement = (props) => {
  const classes = useStyles();
  const resource = props.resource;

  return (
    <div className = {classes.dashboardElement}>
        <div>ID:{resource.id}</div>
        <div>Questionnaire: {resource.questionnaire}</div>
    </div>
  );
};

export default memo(DashboardElement);
