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

function getReference(ehrUrl, reference) {
    

}

function login() {

    const tokenUrl = this.state.config.auth + "/realms/" + this.state.config.realm + "/protocol/openid-connect/token"
    let params = {
        grant_type: "password",
        username: "user1",
        password: "password",
        client_id: this.state.config.client
    }

    // Encodes the params to be compliant with
    // x-www-form-urlencoded content type.
    const searchParams = Object.keys(params).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    // We get the token from the url
    const tokenResponse = fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: searchParams
    }).then((response) => {
        return response.json();
    }).then(response => {
        console.log(response);
        const token = response ? response.access_token : null;
        console.log(token);
        return token;

    }).catch(reason => {
        console.log("wow");
    });

    return tokenResponse;
}


export {
    fhir
}