
import deidentifyPatient from "./deidentifyPatient";
import deidentifyCoverage from "./deidentifyCoverage";
import clone from 'clone'


export default function buildRequest(request, patient, ehrUrl, token, prefetch, includePrefetch, hook, hookConfig, deidentifyRecords) {
    if (deidentifyRecords) {
        // make a copy of the resources before modifying
        let newPrefetch = clone(prefetch);

        console.log("Deidentify Patient and Coverage Resources to remove PHI");
        // loop through the prefetch looking for the patient and the coverage
        newPrefetch.forEach((bundle) => {
            bundle.forEach((resource) => {
                let resourceType = resource.resource.resourceType;
                if (resourceType === "Patient") {
                    // deidentify the patient
                    let patient = deidentifyPatient(resource.resource);
                    // replace the patient resource with the deidentified version
                    resource.resource = patient
                } else if (resourceType === "Coverage") {
                    // deidentify the coverage
                    let coverage = deidentifyCoverage(resource.resource);
                    // replace the coverage resource with the deidentified version
                    resource.resource = coverage
                }
            })
        });

        // set the prefetch reference to the modified copy
        prefetch = newPrefetch
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
            "userId": request.requester.reference.split("/")[1],
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
        r4json.prefetch[key] = resource
      });
    }

    console.log(r4json);
    console.log("--------- r4");
    return r4json;
}
