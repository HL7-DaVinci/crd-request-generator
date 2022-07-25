import React, { memo, useCallback, useState, useEffect } from 'react';
import { TextField, Button } from '@material-ui/core';
import Alert from './Alert';
import axios from 'axios';
import useStyles from './styles';
import config from '../../properties.json';
const Login = (props) => {
  const classes = useStyles();
  const [message, setMessage] = useState(null);
  const [username, _setUsername] = useState('');
  const [password, _setPassword] = useState('');
  const handleClose = useCallback(() => setMessage(null));

  useEffect(() => {
    const listener = event => {
      if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        onSubmit();
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [username, password]);

  const setUsername = useCallback(event => {
    _setUsername(event.target.value);
  });

  const setPassword = useCallback(event => {
    _setPassword(event.target.value);
  });

  const onSubmit = useCallback(() => {
    if (username && password) {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      params.append('grant_type', 'password');
      params.append('client_id', config.client);
      axios
        .post(
          `${config.auth}/realms/${config.realm}/protocol/openid-connect/token`,
          params,
          { withCredentials: true }
        )
        .then((result) => {
          props.tokenCallback(result.data.access_token);
        })
        .catch(err => {
          setMessage('Unable to Login');
          console.error(err);
        });
    }
  }, [username, password]);

  return (
    <div className={classes.background}>
      <Alert message={message} handleClose={handleClose} />

      <div className={`${classes.loginContent} ${classes.formFont}`}>
        <div className={classes.loginHeader}>Log in.</div>
        <div className={classes.loginSubheader}>Log in to view your patient records.</div>
        <form noValidate autoComplete="off" className={classes.formFont}>
          <TextField
            classes={{
              root: classes.loginInput
            }}
            InputProps={{
              classes: {
                input: classes.resize
              }
            }}
            InputLabelProps={{
              classes: {
                root: classes.resize
              }
            }}
            value={username}
            onChange={setUsername}
            label="Username"
          />
          <TextField
            classes={{
              root: `${classes.passwordField} ${classes.loginInput}`
            }}
            InputProps={{
              classes: {
                input: classes.resize
              }
            }}
            InputLabelProps={{
              classes: {
                root: classes.resize
              }
            }}
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
          />
          {/* <div className={`${classes.loginPersistance} ${classes.formFont}`}>
            <input type="checkbox" className={classes.loginCheckbox} />
            <span className={classes.loginCheckboxText}>Keep me logged in</span>
          </div> */}
          <Button
            variant="contained"
            color="secondary"
            disableElevation
            classes={{ root: classes.loginButton, label: classes.formFont }}
            onClick={onSubmit}
          >
            Log In
          </Button>
          <div className={classes.passwordForget}>Forgot password?</div>
        </form>
      </div>
    </div>
  );
};

export default memo(Login);
