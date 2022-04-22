
export default function buildRequest(request, patient, ehrUrl, token, prefetch, includePrefetch, extraPrefetch, hook, hookConfig) {
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
