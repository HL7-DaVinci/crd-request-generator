
export default function buildRequest(request, patient, ehrUrl, token, prefetch, includePrefetch, hook, hookConfig) {
    const r4json = {
        "hookInstance": "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
        "fhirServer": ehrUrl,
        "hook": hook,
        "fhirAuthorization": {
            "access_token": token.access_token,
            "token_type": "Bearer",
            "expires_in": 300,
            "scope": "patient/Patient.read patient/Observation.read",
            "subject": "cds-service4"
        },
        "context": {
            "userId": "Practitioner/example",
            "patientId": patient.id,
            "encounterId": "enc89284"
        }
    };

    // add the extension containing the hook configuration
    if (hookConfig.includeConfig) {
        const extension = {
            "davinci-crd.configuration": {
                "alt-drug": hookConfig.alternativeTherapy
            }
        }
        r4json.extension = extension;
    }

    if (hook === "order-select") {
        r4json.context.draftOrders = {
            "resourceType": "Bundle",
            "entry": [
                {
                    "resource": request
                }
            ]
        }
        r4json.context.selections = [
            request.resourceType + "/" + request.id
        ]
    } else if (hook === "order-sign") {
        r4json.context.draftOrders = {
            "resourceType": "Bundle",
            "entry": [
                {
                    "resource": request
                }
            ]
        }
    }

    if(includePrefetch){
      r4json.prefetch = {};

      prefetch.forEach((resource, key) => {
        if (key === 'DeviceRequest') {
          r4json.prefetch.deviceRequestBundle = {
                  "resourceType": "Bundle",
                  "type": "collection",
                  "entry": resource
              };
        } else if (key === 'ServiceRequest') {
            r4json.prefetch.serviceRequestBundle = {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": resource
                };
        } else if(key === 'MedicationRequest') {
            r4json.prefetch.medicationRequestBundle = {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": resource
                };
        } else if (key === 'MedicationDispense') {
            r4json.prefetch.medicationDispenseBundle = {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": resource
                };
        } else if (key === 'Coverage') {
          r4json.prefetch.coverageBundle = {
                  "resourceType": "Bundle",
                  "type": "collection",
                  "entry": resource
              };
        } else {
          console.error("Invalid prefetch key used: " + key + ".");
        }
      });
    }

    console.log(r4json);
    console.log("--------- r4");
    return r4json;
}
