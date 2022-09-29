import React, { memo, useState, useEffect } from 'react';
import useStyles from './styles';
import DashboardElement from './DashboardElement';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MedicationIcon from '@mui/icons-material/Medication';
import BiotechIcon from '@mui/icons-material/Biotech';
import LogoutIcon from '@mui/icons-material/Logout';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AlarmIcon from '@mui/icons-material/Alarm';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import { Paper } from '@material-ui/core';

const Dashboard = (props) => {
  const classes = useStyles();
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("Loading...")
  const [checked, setChecked] = useState(true)
  const drawerWidth = '340px';
  const handleChange = (event) => {
    setChecked(event.target.checked);
  };

  const addResources = (bundle) => {
    if (bundle.entry) {
      bundle.entry.forEach((e) => {
        const resource = e.resource;
        setResources(resources => [...resources, resource])
      })
    }
  }
  const createIcons = () => {
    const icons = [];
    const style = { fontSize: '40px' };
    const itemStyle = { height: '80px' }
    const qStyle = { height: '80px', backgroundColor: '#f5f5fa' };
    icons.push(['Notifications', <NotificationsIcon sx={style} />, itemStyle]);
    icons.push(['Appointments', <AlarmIcon sx={style} />, itemStyle]);
    icons.push(['Questionnaire Forms', <AssignmentIcon sx={style} />, qStyle]);
    icons.push(['Health Data', <MedicalInformationIcon sx={style} />, itemStyle]);
    icons.push(['Medications', <MedicationIcon sx={style} />, itemStyle]);
    icons.push(['Tests and Results', <BiotechIcon sx={style} />, itemStyle]);
    icons.push(['Settings', <SettingsIcon sx={style} />, itemStyle]);
    icons.push(['Logout', <LogoutIcon sx={style} />, itemStyle]);

    return icons;
  }
  useEffect(() => {
    if (props.client.patient.id) {
      props.client.patient.request('QuestionnaireResponse', { 'pageLimit': 0, 'onPage': addResources }).then(() => {
        setMessage("No QuestionnaireResponses Found for user with patientId: " + props.client.patient.id);
      });
    } else {
      setMessage("Invalid patient: No patientId provided")
    }

  }, [props.client.patient])

  const renderElements = () => {
    let resourcesToRender = [];
    if (checked) {
      resourcesToRender = resources.filter((e) => {
        return e.status === 'in-progress';
      })
    } else {
      resourcesToRender = resources;
    }
    resourcesToRender.reverse();
    return resourcesToRender;
  }
  return (
    <div>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <div className={classes.spacer}>
        </div>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', marginTop: '31px' }}>
            <List>
              {createIcons().map((option) => (
                <div>
                  <ListItem key={option[0]} style={option[2]} disablePadding>
                    <ListItemButton>
                      <ListItemIcon>
                        {option[1]}
                      </ListItemIcon>
                      <ListItemText primaryTypographyProps={{ fontSize: '18px' }} primary={option[0]} />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </div>

              ))}
            </List>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <div className={classes.dashboardArea}>
            <h2 className={classes.elementHeader}>
              Available Forms
            </h2>
            <FormControlLabel style={{ float: 'right' }} control={
              <Checkbox
                checked={checked}
                onChange={handleChange} />}
              label="Only show in-progress forms" />
            {resources.length > 0 ?
              renderElements().map((e) => {
                return <DashboardElement key={e.id} status={e.status} resource={e} client={props.client} />
              }) : <Paper className = {classes.dashboardElement}>{message}</Paper>}
          </div>
        </Box>
      </Box>


    </div>

  );
};

export default memo(Dashboard);
