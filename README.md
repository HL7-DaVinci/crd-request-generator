# Request Generator
This subproject provides a small web application that is capable of generating requests and displaying the CDS Hooks cards that are provided as a response. This project is written in JavaScript and runs in [node.js](https://nodejs.org/en/).  

## Running the request generator standalone
1. Install node.js
2. Clone the repository
  * `git clone https://github.com/mcode/request-generator.git`
3. Install the dependencies
  * `cd request-generator`
  * `npm install`
4. Run the application
  * `npm start`

This should open a browser window directed to the value set in `REACT_APP_URL`. The request-generator assumes the CRD server is running on the default value set for `REACT_APP_SERVER`. This can be changed in the properties file [.env](./.env). [The following section](./README.md#how-to-override-defaults) lists the default values for these environment variables.

## Versions
This application requires node v20.0 or greater.


### How To Override Defaults
The .env file contains the default URI paths, these can be overwritten from the start command as follows:
 `REACT_APP_LAUNCH_URL=http://example.com PORT=6000 npm start`
 
Following are a list of modifiable paths: 

| URI Name               | Default                                          |
| -----------------------|--------------------------------------------------|
| REACT_APP_AUTH         | `http://localhost:8180`                          |
| REACT_APP_EHR_SERVER   | `http://localhost:8080/test-ehr/r4`              |
| REACT_APP_CDS_SERVICE  | `http://localhost:8090/cds-services`             |
| REACT_APP_PUBLIC_KEYS  | `http://localhost:3001/public_keys`              |
| REACT_APP_LAUNCH_URL   | `http://localhost:3005/launch`                   |
| REACT_APP_PIMS_SERVER  | `http://localhost:5051/doctorOrders/api/addRx`   |
| REACT_APP_REALM        |  `ClientFhirServer`                              |
| REACT_APP_CLIENT       |  `app-login`                                     |
| REACT_APP_SERVER       |  `http://localhost:8090`                         |
| REACT_APP_EHR_BASE     |  `http://localhost:8080/test-ehr/r4`             |
| REACT_APP_ORDER_SIGN   |  `rems-order-sign`                               |
| REACT_APP_ORDER_SELECT |  `rems-order-select`                             |
| REACT_APP_USER         |  `alice`                                         |
| REACT_APP_PASSWORD     |  `alice`                                         |
| REACT_APP_ALT_DRUG     |  `true`                                          |
| REACT_APP_SMART_LAUNCH_URL   |  `http://localhost:4040/`                  |
| REACT_APP_DEFAULT_USER |  `pra1234`                                       |
| REACT_APP_RESPONSE_EXPIRATION_DAYS |  `30`                                |
| REACT_APP_HOMEPAGE     |  `http://localhost:8080`                         |
| REACT_APP_URL          |  `http://localhost:3000`                         |
| REACT_APP_URL_FILTER   |  `http://localhost:3000/*`                       |
| REACT_APP_EHR_LINK     |  `http://localhost:8080/ehr-server/`             |
| HTTPS                  |  `false`                                         |
| HTTPS_KEY_PATH         |  `server.key`                                    |
| HTTPS_CERT_PATH        |  `server.cert`                                   |
