# CRD Request Generator
This subproject provides a small web application that is capable of generating CRD requests and displaying the CDS Hooks cards that are provided as a response. This project is written in JavaScript and runs in [node.js](https://nodejs.org/en/).  

## Running the request generator standalone
1. Install node.js
2. Clone the repository
  * `git clone https://github.com/mcode/crd-request-generator.git`
3. Install the dependencies
  * `cd request-generator`
  * `npm install`
4. Run the application
  * `npm start`

This should open a browser window directed to http://localhost:3000. The request-generator assumes the CRD server is running on `localhost:8090`. This can be changed in the properties file [properties.json](src/properties.json).

## Versions
This application requires node v20.0 or greater.


### How To Override Defaults
# check that the example is correct for this repo, ask about URI vs URL
The .env file contains the default URI paths, these can be overwritten from the start command as follows:
 `REACT_APP_REMS_HOOKS_PATH=http://example.com PORT=6000 npm start`
 
Following are a list of modifiable paths: 

| URI Name               | Default                                          |
| -----------------------|--------------------------------------------------|
| REACT_APP_AUTH         | `http://localhost:8180/auth`                     |
| REACT_APP_EHR_SERVER   | `http://localhost:8080/test-ehr/r4`              |
| REACT_APP_CDS_SERVICE  | `http://localhost:8090/cds-services`             |
| REACT_APP_PUBLIC_KEYS  | `http://localhost:3001/public_keys`              |
| REACT_APP_LAUNCH_URL   | `http://localhost:3005/launch`                   |
| REACT_APP_PIMS_SERVER  | `http://localhost:5051/doctorOrders/api/addRx`   |

# below are not done/ not confirmed working

| HOMEPAGE              | `http://localhost:8080`                           | # leave alone?
| URL                   | `http://localhost:3000`                           | # can't confirm
| URL_FILTER            | `http://localhost:3000/*`                         | # can't confirm
| SERVER                | `http://localhost:8090`                           | # can't find
| EHR_LINK              | `http://localhost:8080/ehr-server/`               | # can't confirm 