
export default function deidentifyPatient(patient) {
    let newPatient = {};
    const profile = "http://hl7.org/fhir/us/davinci-crd/StructureDefinition/profile-patient-deident";
    const metaKey = "meta";
    const profileKey = "profile";

    for (const key in patient) {
        // remove: text, identifier, name, telecom, deceased, multipleBirth, photo, contact, link
        if ((key !== "text") && (key !== "identifier") && (key !== "name") && (key !== "telecom") && (key !== "deceased") && (key !== "multipleBirth") && (key !== "photo") && (key !== "contact") && (key !== "link")) {
            // handle birthDate
            if (key === "birthDate") {
                newPatient[key] = processDate(patient[key]);
            }
            else if (key === "address") {
                // remove the following from address: text, line, city, district, postalCode, period
                let addresses = patient[key];
                let newAddresses = [];
                for (const addrIndex in addresses) {
                    let address = addresses[addrIndex];
                    let newAddress = {};
                    for (const addrKey in address) {
                        if ((addrKey !== "text") && (addrKey !== "line") && (addrKey !== "city") && (addrKey !== "district") && (addrKey !== "postalCode") && (addrKey !== "period")) {
                            newAddress[addrKey] = address[addrKey];
                        }
                    }
                    newAddresses.push(newAddress);
                }
                newPatient[key] = newAddresses;
            }
            else if (key === metaKey) {
                // copy meta if there is one
                let meta = patient[key];

                if (profileKey in meta) {
                    // make sure the profile is not already in the list
                    if (!meta[profileKey].includes(profile)) {
                        // append to the existing profile list
                        meta[profileKey].push(profile);
                    }
                } else {
                    // add the profile to meta
                    meta[profileKey] = [ profile ];
                }
                newPatient[key] = meta
            }
            else {
                newPatient[key] = patient[key];
            }
        }
    }

    // if no meta, add it with the profile
    if (!(metaKey in newPatient)) {
        newPatient[metaKey] = { [profileKey]: [ profile ] };
    }

    return newPatient;
}

function processDate(dateString) {
    let date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // just the year
    let newDateString = date.toISOString().substring(0,4);

    // if less than two years old include the month
    if (diffDays < (2 * 365)) {
        newDateString = date.toISOString().substring(0,7);
    }
    return newDateString;
}