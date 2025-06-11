import React, { Component } from 'react';
import {
  Autocomplete,
  TextField,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { getAge } from '../../util/fhir';
import FHIR from 'fhirclient';
import './smart.css';

export default class SMARTBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: 'none',
      deviceRequests: {},
      medicationRequests: {},
      serviceRequests: {},
      medicationDispenses: {},
      response: 'none',
      questionnaireResponses: {},
      isLoadingRequests: false,
      isLoadingResponses: false,
      requestsError: null,
      responsesError: null,
    };

    this.handleRequestChange = this.handleRequestChange.bind(this);

    this.updatePrefetchRequest = this.updatePrefetchRequest.bind(this);
    this.getDeviceRequest = this.getDeviceRequest.bind(this);
    this.getServiceRequest = this.getServiceRequest.bind(this);
    this.getMedicationRequest = this.getMedicationRequest.bind(this);
    this.getMedicationDispense = this.getMedicationDispense.bind(this);
    this.getRequests = this.getRequests.bind(this);
    this.getResponses = this.getResponses.bind(this);
    this.makeQROption = this.makeQROption.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
  }

  getCoding(request) {
    let code = null;
    if (request.resourceType === 'DeviceRequest') {
      code = request.codeCodeableConcept.coding[0];
    } else if (request.resourceType === 'ServiceRequest') {
      code = request.code.coding[0];
    } else if (
      request.resourceType === 'MedicationRequest' ||
      request.resourceType === 'MedicationDispense'
    ) {
      code = request.medicationCodeableConcept.coding[0];
    }
    if (code) {
      if (!code.code) {
        code.code = 'Unknown';
      }
      if (!code.display) {
        code.display = 'Unknown';
      }
      if (!code.system) {
        code.system = 'Unknown';
      }
    } else {
      code.code = 'Unknown';
      code.display = 'Unknown';
      code.system = 'Unknown';
    }
    return code;
  }

  makeOption(request, options) {
    let code = this.getCoding(request);
    let option = {
      key: request.id,
      text: '(' + code.code + ') ' + code.display,
      value: JSON.stringify(request),
      content: (
        <Box>
          <Typography variant='subtitle1' component='div'>
            {code.code + ' (' + request.resourceType + ')'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {code.display}
          </Typography>
        </Box>
      ),
    };
    options.push(option);
  }

  updateValues(patient) {
    this.props.callback('patient', patient);
    this.props.callback('openPatient', false);
    this.props.clearCallback();
    if (this.state.request !== 'none') {
      const request = JSON.parse(this.state.request);
      if (
        request.resourceType === 'DeviceRequest' ||
        request.resourceType === 'ServiceRequest' ||
        request.resourceType === 'MedicationRequest' ||
        request.resourceType === 'MedicationDispense'
      ) {
        this.updatePrefetchRequest(request);
      } else {
        this.props.clearCallback();
      }
    }

    if (this.state.response !== 'none') {
      const response = JSON.parse(this.state.response);
      this.updateQRResponse(patient, response);
    }
  }

  updateQRResponse(patient, response) {
    this.props.callback('response', response);
  }

  updatePrefetchRequest(request) {
    this.props.callback(request.resourceType, request);
    const queries = this.props.updatePrefetchCallback(
      request,
      request.resourceType,
      'Coverage'
    );
    queries.forEach((query, queryKey) => {
      const urlQuery = this.props.ehrUrl + '/' + query;
      fetch(urlQuery, {
        method: 'GET',
      })
        .then((response) => {
          const responseJson = response.json();
          return responseJson;
        })
        .then((bundle) => {
          bundle['entry'].forEach((fullResource) => {
            this.props.callbackMap(
              'prefetchedResources',
              queryKey,
              fullResource
            );
          });
        });
    });
    this.props.callback('request', request);
    const coding = this.getCoding(request);
    this.props.callback('code', coding.code);
    this.props.callback('codeSystem', coding.system);
    this.props.callback('display', coding.display);
  }
  getDeviceRequest(patientId, client) {
    return client
      .request(`DeviceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer'],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ deviceRequests: result });
        return result;
      })
      .catch((error) => {
        console.error('Error fetching device requests:', error);
        throw error;
      });
  }

  getServiceRequest(patientId, client) {
    return client
      .request(`ServiceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer'],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ serviceRequests: result });
        return result;
      })
      .catch((error) => {
        console.error('Error fetching service requests:', error);
        throw error;
      });
  }

  getMedicationRequest(patientId, client) {
    return client
      .request(`MedicationRequest?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer'],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ medicationRequests: result });
        return result;
      })
      .catch((error) => {
        console.error('Error fetching medication requests:', error);
        throw error;
      });
  }

  getMedicationDispense(patientId, client) {
    return client
      .request(`MedicationDispense?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer'],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ medicationDispenses: result });
        return result;
      })
      .catch((error) => {
        console.error('Error fetching medication dispenses:', error);
        throw error;
      });
  }
  handleRequestChange(event, newValue) {
    if (!newValue || newValue.value === 'none') {
      this.setState({
        request: 'none',
      });
    } else {
      try {
        let request = JSON.parse(newValue.value);
        let coding = this.getCoding(request);
        this.setState({
          request: newValue.value,
          code: coding.code,
          system: coding.system,
          display: coding.display,
          response: 'none',
        });
      } catch (error) {
        console.error('Error parsing request:', error);
        this.setState({
          request: 'none',
          requestsError: 'Error parsing request data',
        });
      }
    }
  }

  handleResponseChange(event, newValue) {
    if (!newValue || newValue.value === 'none') {
      this.setState({
        response: 'none',
      });
    } else {
      try {
        this.setState({
          response: newValue.value,
          responsesError: null,
        });
      } catch (error) {
        console.error('Error parsing response:', error);
        this.setState({
          response: 'none',
          responsesError: 'Error parsing response data',
        });
      }
    }
  }
  getRequests() {
    this.setState({
      isLoadingRequests: true,
      requestsError: null,
    });

    try {
      const client = FHIR.client(this.props.params);
      const patientId = this.props.patient.id;

      Promise.all([
        this.getDeviceRequest(patientId, client),
        this.getServiceRequest(patientId, client),
        this.getMedicationRequest(patientId, client),
        this.getMedicationDispense(patientId, client),
      ])
        .then(() => {
          this.setState({ isLoadingRequests: false });
        })
        .catch((error) => {
          console.error('Error loading requests:', error);
          this.setState({
            isLoadingRequests: false,
            requestsError: 'Failed to load requests',
          });
        });
    } catch (error) {
      console.error('Error initializing FHIR client:', error);
      this.setState({
        isLoadingRequests: false,
        requestsError: 'Failed to connect to FHIR server',
      });
    }
  }
  /**
   * Retrieve QuestionnaireResponse
   */
  getResponses() {
    this.setState({
      isLoadingResponses: true,
      responsesError: null,
    });

    try {
      const client = FHIR.client(this.props.params);
      const patientId = this.props.patient.id;

      let updateDate = new Date();
      updateDate.setDate(
        updateDate.getDate() - this.props.responseExpirationDays
      );
      client
        .request(
          `QuestionnaireResponse?_lastUpdated=gt${
            updateDate.toISOString().split('T')[0]
          }&status=in-progress&subject=Patient/${patientId}`,
          {
            resolveReferences: ['subject'],
            graph: false,
            flat: true,
          }
        )
        .then((result) => {
          this.setState({
            questionnaireResponses: result,
            isLoadingResponses: false,
          });
        })
        .catch((error) => {
          console.error('Error fetching questionnaire responses:', error);
          this.setState({
            isLoadingResponses: false,
            responsesError: 'Failed to load responses',
          });
        });
    } catch (error) {
      console.error('Error initializing FHIR client for responses:', error);
      this.setState({
        isLoadingResponses: false,
        responsesError: 'Failed to connect to FHIR server',
      });
    }
  }
  makeQROption(qr, options) {
    const display = `${qr.questionnaire}: created at ${qr.authored}`;
    let option = {
      key: qr.id,
      text: display,
      value: JSON.stringify(qr),
      content: (
        <Box>
          <Typography variant='subtitle1' component='div'>
            QuestionnaireResponse
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {display}
          </Typography>
        </Box>
      ),
    };
    options.push(option);
  }
  render() {
    const patient = this.props.patient;
    let name = '';
    if (patient.name) {
      name = `${patient.name[0].given[0]} ${patient.name[0].family}`;
    }

    // add all of the requests to the list of options
    let options = [
      {
        key: 'none',
        text: 'None',
        value: 'none',
      },
    ];
    let responseOptions = [
      {
        key: 'none',
        text: 'None',
        value: 'none',
      },
    ];

    let returned = false;
    if (this.state.deviceRequests.data) {
      returned = true;
      console.log(this.state.deviceRequests);
      this.state.deviceRequests.data.forEach((e) => {
        this.makeOption(e, options);
      });
    }
    if (this.state.serviceRequests.data) {
      this.state.serviceRequests.data.forEach((e) => {
        this.makeOption(e, options);
      });
    }
    if (this.state.medicationRequests.data) {
      this.state.medicationRequests.data.forEach((e) => {
        this.makeOption(e, options);
      });
    }

    if (this.state.medicationDispenses.data) {
      this.state.medicationDispenses.data.forEach((e) => {
        this.makeOption(e, options);
      });
    }

    if (this.state.questionnaireResponses.data) {
      returned = true;
      this.state.questionnaireResponses.data.forEach((qr) =>
        this.makeQROption(qr, responseOptions)
      );
    }

    let noResults = 'No results found.';
    if (!returned) {
      noResults = 'Loading...';
    }    return (
      <Box sx={{ mb: 1, width: '100%' }}>
        <Card
          elevation={2}
          sx={{
            borderRadius: 1.5,
            overflow: 'visible',
            height: 'auto',
          }}
        >
          <CardContent
            sx={{
              p: { xs: 1, md: 1.5 },
              '&:last-child': { pb: { xs: 1, md: 1.5 } },
            }}
          >
            {' '}            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: { xs: 1, md: 1.5 },
                alignItems: { xs: 'stretch', lg: 'center' },
              }}
            >
              {/* Patient Info Section - Clickable */}{' '}              <Box
                sx={{
                  flex: 1,
                  minWidth: 200,
                  cursor: 'pointer',
                  p: { xs: 0.75, md: 1 },
                  borderRadius: 1,
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                onClick={() => {
                  this.updateValues(patient);
                }}
              >
                {' '}                <Typography
                  variant='h6'
                  component='div'                  sx={{
                    mb: 1,
                    color: 'primary.main',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                  }}
                >
                  <PersonIcon sx={{ fontSize: 'inherit' }} /> Patient Information
                </Typography>
                <Stack spacing={0.75}>
                  {' '}                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Chip
                      label='ID'
                      variant='filled'
                      size='small'
                      color='primary'
                      sx={{
                        minWidth: 40,
                        fontWeight: 'bold',
                        fontSize: '0.6rem',
                        height: 20,
                      }}
                    />
                    <Typography
                      variant='body2'
                      sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '0.8rem' }}
                    >
                      {patient.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Chip
                      label='Name'
                      variant='filled'
                      size='small'
                      color='secondary'
                      sx={{
                        minWidth: 40,
                        fontWeight: 'bold',
                        fontSize: '0.6rem',
                        height: 20,
                      }}
                    />
                    <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                      {name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Chip
                      label='Gender'
                      variant='filled'
                      size='small'
                      color='info'
                      sx={{
                        minWidth: 40,
                        fontWeight: 'bold',
                        fontSize: '0.6rem',
                        height: 20,
                      }}
                    />
                    <Typography
                      variant='body2'
                      sx={{ textTransform: 'capitalize', fontSize: '0.8rem' }}
                    >
                      {patient.gender || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Chip
                      label='Age'
                      variant='filled'
                      size='small'
                      color='success'
                      sx={{
                        minWidth: 40,
                        fontWeight: 'bold',
                        fontSize: '0.6rem',
                        height: 20,
                      }}
                    />
                    <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                      {getAge(patient.birthDate)
                        ? `${getAge(patient.birthDate)} years`
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>                <Box
                  sx={{ mt: 0.75, pt: 0.75, borderTop: 1, borderColor: 'divider' }}
                >
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}
                  >
                    Click to select this patient
                  </Typography>
                </Box>
              </Box>              <Divider
                orientation={{ xs: 'horizontal', lg: 'vertical' }}
                flexItem
                sx={{
                  mx: { xs: 0, lg: 0.5 },
                  my: { xs: 0.5, lg: 0 },
                }}
              />
              {/* Request Selection Section - Non-clickable */}
              <Box sx={{ flex: 1.5, minWidth: 250 }}>
                {' '}                <Typography
                  variant='h6'
                  component='div'
                  sx={{
                    mb: 1,
                    color: 'secondary.main',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 'inherit' }} /> Request Selection
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    {' '}                    <Typography
                      variant='subtitle1'
                      sx={{
                        mb: 0.75,
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.9rem',
                      }}
                    >
                      Request:
                    </Typography>                    {this.state.requestsError && (
                      <Alert severity='error' sx={{ mb: 1 }}>
                        {this.state.requestsError}
                      </Alert>
                    )}
                    <Autocomplete
                      options={options}
                      getOptionLabel={(option) => option.text || ''}
                      value={
                        options.find(
                          (opt) => opt.value === this.state.request
                        ) || null
                      }
                      onChange={(event, newValue) =>
                        this.handleRequestChange(event, newValue)
                      }
                      onOpen={this.getRequests}
                      loading={this.state.isLoadingRequests}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder='Select a request...'
                          variant='outlined'
                          size='small'
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {this.state.isLoadingRequests ? (
                                  <CircularProgress color='inherit' size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: 'primary.main',
                              },
                            },
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component='li' {...props} key={option.key}>
                          {option.content || (
                            <Typography variant='body2'>
                              {option.text}
                            </Typography>
                          )}
                        </Box>
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      sx={{ width: '100%' }}
                      noOptionsText={
                        this.state.isLoadingRequests ? 'Loading...' : noResults
                      }
                    />
                  </Box>

                  <Box>
                    {' '}                    <Typography
                      variant='subtitle1'
                      sx={{
                        mb: 0.75,
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.9rem',
                      }}
                    >
                      In Progress Form:
                    </Typography>                    {this.state.responsesError && (
                      <Alert severity='error' sx={{ mb: 1 }}>
                        {this.state.responsesError}
                      </Alert>
                    )}
                    <Autocomplete
                      options={responseOptions}
                      getOptionLabel={(option) => option.text || ''}
                      value={
                        responseOptions.find(
                          (opt) => opt.value === this.state.response
                        ) || null
                      }
                      onChange={(event, newValue) =>
                        this.handleResponseChange(event, newValue)
                      }
                      onOpen={this.getResponses}
                      loading={this.state.isLoadingResponses}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder='Select an in-progress form...'
                          variant='outlined'
                          size='small'
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {this.state.isLoadingResponses ? (
                                  <CircularProgress color='inherit' size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: 'secondary.main',
                              },
                            },
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component='li' {...props} key={option.key}>
                          {option.content || (
                            <Typography variant='body2'>
                              {option.text}
                            </Typography>
                          )}
                        </Box>
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      sx={{ width: '100%' }}
                      noOptionsText={
                        this.state.isLoadingResponses
                          ? 'Loading...'
                          : 'No forms found'
                      }
                    />
                  </Box>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }
}
