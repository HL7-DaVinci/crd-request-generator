

export default function getRequest(request, patient, ehrUrl, token, prefetch, version, includePrefetch) {
    const patId = patient.id;
    const r4json = {
        "hookInstance": "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
        "fhirServer": ehrUrl.r4,
        "hook": "order-review",
        "fhirAuthorization": {
            "access_token": token.access_token,
            "token_type": "Bearer",
            "expires_in": 300,
            "scope": "patient/Patient.read patient/Observation.read",
            "subject": "cds-service4"
        },
        "user": "Practitioner/example",
        "context": {
            "patientId": patId,
            "encounterId": "enc89284",
            "orders": {
                "resourceType": "Bundle",
                "entry": [
                    request
                ]
            }
        }
    };
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
        }
        
    }

    // stu3 //
    const stu3json = {
        "hook": "order-review",
        "hookInstance": "63d7d1fa-9469-4c44-a5f7-76a129e30967",
        "fhirServer": ehrUrl.stu3,
        "fhirAuthorization": null,
        "user": "Practitioner/1234",
        "context": {
          "patientId": patId,
          "encounterId": null,
          "services": null,
          "orders": {
            "resourceType": "Bundle",
            "entry": [
              request
            ]
          }
        }
      };

      if(includePrefetch) {
        stu3json.prefetch = {
            "deviceRequestBundle":{
                "resourceType": "Bundle",
                "type": "collection",
                "entry": prefetch
            }
        }
    }

    if (version==="stu3") {
        console.log(stu3json);
        console.log("--------- stu3");
        return stu3json;
    } else if (version==="r4") {
        console.log(r4json);
        console.log("--------- r4");
        return r4json;
    }
}