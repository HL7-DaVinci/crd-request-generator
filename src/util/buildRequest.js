
import deidentifyPatient from "./deidentifyPatient";
import deidentifyCoverage from "./deidentifyCoverage";

export default function buildRequest(request, patient, ehrUrl, token, inputPrefetch, includePrefetch, extraPrefetch, hook, hookConfig, deidentifyRecords) {
    
    var prefetch = [];

    if (deidentifyRecords) {
        console.log("Deidentify Patient and Coverage Resources to remove PHI");
        // loop through the prefetch looking for the patient and the coverage
        inputPrefetch.forEach((resource) => {
            let resourceType = resource.resource.resourceType;
            if (resourceType === "Patient") {
                let patient = deidentifyPatient(resource.resource);
                let patientResource = { "resource" : patient };
                prefetch.push(patientResource);
            } else if (resourceType === "Coverage") {
                let coverage = deidentifyCoverage(resource.resource);
                let coverageResource = { "resource" : coverage };
                prefetch.push(coverageResource);
            } else {
                prefetch.push(resource);
            }
        });
    } else {
        prefetch = inputPrefetch;
    }

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
        if(request.resourceType === 'DeviceRequest') {
            r4json.prefetch = {
                "deviceRequestBundle": {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": prefetch
                }
            }
        } else if(request.resourceType === 'ServiceRequest') {
            r4json.prefetch = {
                "serviceRequestBundle": {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": prefetch
                }
            }
        } else if(request.resourceType === 'MedicationRequest') {
            if (extraPrefetch != null) {
                r4json.prefetch = {
                    "medicationRequestBundle": {
                        "resourceType": "Bundle",
                        "type": "collection",
                        "entry": prefetch
                    },
                    "medicationStatementBundle": {
                        "resourceType": "Bundle",
                        "type": "collection",
                        "entry": extraPrefetch
                    }
                }
            } else {
                r4json.prefetch = {
                    "medicationRequestBundle": {
                        "resourceType": "Bundle",
                        "type": "collection",
                        "entry": prefetch
                    }
                }
            }
        } else if(request.resourceType === 'MedicationDispense') {
            r4json.prefetch = {
                "medicationDispenseBundle": {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": prefetch
                }
            }
        }
    }

    console.log(r4json);
    console.log("--------- r4");
    return r4json;
}
