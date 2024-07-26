# CRD Request Generator
This subproject provides a small web application that is capable of generating CRD requests and displaying the CDS Hooks cards that are provided as a response. This project is written in JavaScript and runs in [node.js](https://nodejs.org/en/).  

## Running the request generator standalone
1. Install [Node.js 16](https://nodejs.org) (Node 18+ not currently supported)
2. Clone the repository
  * `git clone https://github.com/HL7-DaVinci/crd-request-generator.git`
3. Install the dependencies
  * `cd request-generator`
  * `npm install`
4. Run the application
  * `npm start`

This should open a browser window directed to http://localhost:3000. The request-generator assumes the CRD server is running on `localhost:8090`. This can be changed in the properties file [properties.json](src/properties.json).

## Questions and Contributions
Questions about the project can be asked in the [Da Vinci CRD stream on the FHIR Zulip Chat](https://chat.fhir.org/#narrow/stream/180803-Da-Vinci.20CRD).

This project welcomes Pull Requests. Any issues identified with the RI should be submitted via the [GitHub issue tracker](https://github.com/HL7-DaVinci/crd-request-generator/issues).

As of October 1, 2022, The Lantana Consulting Group is responsible for the management and maintenance of this Reference Implementation.
In addition to posting on FHIR Zulip Chat channel mentioned above you can contact [Corey Spears](mailto:corey.spears@lantanagroup.com) for questions or requests.
