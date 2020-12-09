
function buildR4Request(request, patient, ehrUrl, token, prefetch, includePrefetch, hook) {    
    const r4json = {
        "hookInstance": "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
        "fhirServer": ehrUrl.r4,
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

    if (hook === "order-review") {
        r4json.context.orders = {
            "resourceType": "Bundle",
            "entry": [
                request
            ]
        }
    } else if (hook === "order-select") {
        r4json.context.draftOrders = {
            "resourceType": "Bundle",
            "entry": [
                request
            ]
        }
        r4json.context.selections = [
            request.resourceType + "/" + request.id
        ]
    } else if (hook === "order-sign") {
        r4json.context.draftOrders = {
            "resourceType": "Bundle",
            "entry": [
                request
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
            r4json.prefetch = {
                "medicationRequestBundle": {
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

function buildStu3Request(request, patient, ehrUrl, token, prefetch, includePrefetch, hook) {    
    const stu3json = {
        "hook": hook,
        "hookInstance": "63d7d1fa-9469-4c44-a5f7-76a129e30967",
        "fhirServer": ehrUrl.stu3,
        "fhirAuthorization": null,
        "context": {
          "userId": "Practitioner/1234",
          "patientId": patient.id,
          "encounterId": null,
          "services": null
        }
    };

    if (hook === "order-review") {
        stu3json.context.orders = {
            "resourceType": "Bundle",
            "entry": [
                request
            ]
        }
    } else if (hook === "order-select") {
        stu3json.context.draftOrders = {
            "resourceType": "Bundle",
            "entry": [
                request
            ]
        }
        stu3json.context.selections = [
            request.resourceType + "/" + request.id
        ]
    } else if (hook === "order-sign") {
        stu3json.context.draftOrders = {
            "resourceType": "Bundle",
            "entry": [
                request
            ]
        }
    }

    if (includePrefetch) {
        stu3json.prefetch = {
            "deviceRequestBundle":{
                "resourceType": "Bundle",
                "type": "collection",
                "entry": prefetch
            }
        }
    }

    console.log(stu3json);
    console.log("--------- stu3");
    return stu3json;
}

export default function buildRequest(request, patient, ehrUrl, token, prefetch, version, includePrefetch, hook) {
    if (version==="stu3") {
        return buildStu3Request(request, patient, ehrUrl, token, prefetch, includePrefetch, hook);
    } else if (version==="r4") {
        return buildR4Request(request, patient, ehrUrl, token, prefetch, includePrefetch, hook);
    }
}