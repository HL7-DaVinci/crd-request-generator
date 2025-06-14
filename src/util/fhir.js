function fhir(resource, ehrUrl, patient, auth) {
    const headers = {
        "Content-Type": "application/json"
    }
    if(patient) {
        fetch(`${ehrUrl}${resource}?subject=Patient/${patient}`, {
            method: "GET",
            headers: headers,
        }).then(response => {
            return response.json();
        }).then(json =>{
            console.log(json);
        });
    }

}

function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function getReference(ehrUrl, reference) {
    

}

/**
 * Resolve a FHIR reference to its actual resource
 * @param {Object} parentResource - The parent resource containing the reference
 * @param {Object|string} reference - The reference object or reference string
 * @param {string} baseUrl - The FHIR server base URL
 * @param {Object} headers - HTTP headers to include in requests (e.g., Authorization)
 * @param {string} expectedResourceType - The expected resource type (optional)
 * @returns {Promise<Object|null>} - The resolved resource or null
 */
async function resolveReference(parentResource, reference, baseUrl, headers = {}, expectedResourceType = null) {
    // Handle both reference objects and direct reference strings
    const referenceString = typeof reference === 'string' ? reference : reference?.reference;
    
    if (!referenceString) {
        return null;
    }

    try {
        // Check if it's a contained resource reference (starts with #)
        if (referenceString.startsWith('#')) {
            const containedId = referenceString.substring(1); // Remove the # prefix
            
            // Look for the resource in the contained array
            if (parentResource.contained && Array.isArray(parentResource.contained)) {
                const containedResource = parentResource.contained.find(
                    resource => resource.id === containedId && 
                    (expectedResourceType ? resource.resourceType === expectedResourceType : true)
                );
                return containedResource || null;
            }
            return null;
        }
        
        // For external references, attempt to fetch from the FHIR server
        if (referenceString.startsWith('http') || referenceString.includes('/')) {
            // Build the full URL if it's a relative reference
            let fullUrl = referenceString;
            if (!referenceString.startsWith('http')) {
                fullUrl = `${baseUrl}/${referenceString}`;
            }
            
            const requestHeaders = {
                'Accept': 'application/fhir+json',
                ...headers
            };
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: requestHeaders
            });
            
            if (!response.ok) {
                console.warn(`Failed to fetch external reference ${referenceString}: ${response.status}`);
                return null;
            }
            
            const resource = await response.json();
            
            // Verify resource type if specified
            if (expectedResourceType && resource.resourceType !== expectedResourceType) {
                console.warn(`Expected ${expectedResourceType} but got ${resource.resourceType} for reference ${referenceString}`);
                return null;
            }
            
            return resource;
        }
        
        // If we can't resolve the reference, log and return null
        console.warn(`Unable to resolve reference: ${referenceString}`);
        return null;
        
    } catch (error) {
        console.error(`Error resolving reference ${referenceString}:`, error);
        return null;
    }
}

/**
 * Resolve multiple references in parallel
 * @param {Array} referenceSpecs - Array of objects with {parentResource, reference, expectedResourceType}
 * @param {string} baseUrl - The FHIR server base URL
 * @param {Object} headers - HTTP headers to include in requests
 * @returns {Promise<Array>} - Array of resolved resources (same order as input, null for failed resolutions)
 */
async function resolveReferences(referenceSpecs, baseUrl, headers = {}) {
    return Promise.all(
        referenceSpecs.map(spec => 
            resolveReference(spec.parentResource, spec.reference, baseUrl, headers, spec.expectedResourceType)
        )
    );
}


export {
    fhir,
    getAge,
    resolveReference,
    resolveReferences
}