import { makeStyles } from '@material-ui/core/styles';
export default makeStyles(
  theme => ({
    background: {
      backgroundColor: theme.palette.common.offWhite,
      height: '100vh',
      overflow: 'hidden'
    },
    formFont: {
      fontFamily: '"Gill Sans", sans-serif'
    },
    loginButton: {
      width: '460px',
      marginTop: '20px',
      height: '90px',
      color: theme.palette.common.white,
      fontSize: '32px',
      textTransform: 'none',
      fontFamily: 'inherit',
      fontWeight: 200
    },
    loginContent: {
      width: '600px',
      height: '700px',
      boxShadow: '0 4px 4px rgba(0, 0, 0, 0.10)',
      backgroundColor: theme.palette.common.white,
      margin: '150px auto 0px auto',
      paddingLeft: '75px',
      paddingTop: '90px',
      textAlign: 'left'
    },
    loginHeader: {
      fontSize: '36px',
      fontWeight: 600,
      width: '100%',
      color: theme.palette.common.grayDark,
      fontFamily: 'inherit'
    },
    loginInput: {
      display: 'block',
      fontFamily: 'inherit'
    },
    loginPersistance: {
      display: 'flex',
      lineHeight: '144px'
    },
    loginCheckbox: {
      height: '24px',
      width: '24px',
      margin: '60px 0px 15px 0px'
    },
    loginCheckboxText: {
      fontWeight: 100,
      fontSize: '24px',
      marginLeft: '20px',
      color: theme.palette.common.grayLightText,
      fontFamily: 'inherit'
    },
    loginSubheader: {
      fontSize: '24px',
      textAlign: 'left',
      fontWeight: 100,
      color: theme.palette.common.grayLightText,
      marginTop: '20px',
      fontFamily: 'inherit'
    },
    passwordField: {
      marginTop: '30px'
    },
    passwordForget: {
      float: 'right',
      color: theme.palette.common.red,
      margin: '10px 70px 0px 0px',
      fontSize: '24px',
      fontFamily: 'inherit',
      cursor: 'pointer'
    },
    resize: {
      display: 'block',
      marginTop: '30px',
      marginBottom: '5px',
      fontSize: '20px',
      fontWeight: 100,
      color: theme.palette.common.black,
      width: '450px'
    }
  }),

  { name: 'Auth', index: 1 }
);
