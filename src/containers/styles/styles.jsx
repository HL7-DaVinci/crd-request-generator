import { makeStyles } from '@material-ui/core/styles';
export default makeStyles(
  theme => ({
    background: {
      backgroundColor: theme.palette.common.offWhite,
      height: '100vh'
    },
    adminBar: {
      height: '95px',
      backgroundColor: theme.palette.common.redDark,
      width: '100%',
      textAlign: 'center',
      lineHeight: '95px'
    },
    adminBarText: {
      color: theme.palette.common.white,
      fontSize: '19px',
      fontFamily: 'Verdana',
      float: 'left',
      marginLeft: '20px'
    },
    formFont: {
      fontFamily: '"Gill Sans", sans-serif'
    },
  }),

  { name: 'PatientPortal', index: 1 }
);
