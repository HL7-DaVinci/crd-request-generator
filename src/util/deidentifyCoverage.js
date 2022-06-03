
export default function deidentifyCoverage(coverage) {
    let newCoverage = {};
    const profile = "http://hl7.org/fhir/us/davinci-crd/StructureDefinition/profile-coverage-deident";
    const metaKey = "meta";
    const profileKey = "profile";

    for (const key in coverage) {
        // remove: text, identifier, policyHolder, subscriber, subscriberId, dependent, relationship, order, network, costToBeneficiary, subrogation, contract
        if ((key !== "text") && (key !== "identifier") && (key !== "policyHolder") && (key !== "subscriber") && (key !== "subscriberId") && (key !== "dependent") && (key !== "relationship") && (key !== "order") && (key !== "network") && (key !== "costToBeneficiary") && (key !== "subrogation") && (key !== "contract")) {
            if (key === metaKey) {
                // copy meta if there is one
                let meta = coverage[key];

                if (profileKey in meta) {
                    // append to the existing profile list
                    meta[profileKey].push(profile);
                } else {
                    // add the profile to meta
                    meta[profileKey] = [ profile ];
                }
                newCoverage[key] = meta
            }
            else {
                newCoverage[key] = coverage[key];
            }
        }
    }

    // if no meta, add it with the profile
    if (!(metaKey in newCoverage)) {
        newCoverage[metaKey] = { [profileKey]: [ profile ] };
    }

    return newCoverage;
}