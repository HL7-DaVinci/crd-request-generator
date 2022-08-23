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
      backgroundColor: 'white',
      margin: '80px',
      padding: '20px'
    },
    dashboardElement: {
      height: '100px',
      width: '100%',
      padding: '10px',
      border: '1px solid black',
      borderLeft: '3px solid #f50057',
      margin: '5px',
      backgroundColor: '#fafafa',
      '&:hover': {
        backgroundColor: '#fff'
      }
    },

  }),

  { name: 'Dashboard', index: 1 }
);
