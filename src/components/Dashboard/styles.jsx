import { makeStyles } from '@material-ui/core/styles';
export default makeStyles(
  theme => ({
    adminBar: {
      height: '95px',
      backgroundColor: theme.palette.common.purple,
      width: '100%',
      textAlign: 'center',
      lineHeight: '95px'
    },
    formFont: {
      fontFamily: '"Gill Sans", sans-serif'
    },
    dashboardArea: {
      backgroundColor: '#fdfdfd',
      margin: '80px 60px 0px 60px',
      padding: '20px',
      overflowY: 'auto',
      overflowX: 'hidden',
      height: '75vh',
    },
    dashboardElement: {
      height: '100px',
      width: '100%',
      padding: '10px',
      margin: '5px',
      fontSize: '18px',
      cursor:'pointer',
      '&:hover': {
        boxShadow: '0px 2px 1px 1px rgb(0 0 0 / 40%), 0px 1px 1px 0px rgb(0 0 0 / 28%), 0px 1px 3px 0px rgb(0 0 0 / 24%)'
      }
    },
    elementHeader: {
      marginLeft: '5px',
      display: 'inline-block',
    },
    elementIcon: {
      verticalAlign: 'middle'
    },
    listItemText:{
      fontSize:'4.2em',//Insert your required size
    },
    progressBubble: {
      height: '12px',
      width: '12px',
      borderRadius: '12px',
      float: 'right'
    },
    spacer: {

    }
  }),

  { name: 'Dashboard', index: 1 }
);
