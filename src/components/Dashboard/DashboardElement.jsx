import React, { memo, useCallback, useState, useEffect } from 'react';
import { TextField, Button } from '@material-ui/core';
import axios from 'axios';

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
