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

function login() {

    const tokenUrl = (process.env.REACT_APP_AUTH ? process.env.REACT_APP_AUTH : this.state.config.auth) + "/realms/" + (process.env.REACT_APP_REALM ? process.env.REACT_APP_REALM : this.state.config.realm) + "/protocol/openid-connect/token"
    let params = {
        grant_type: "password",
        username: "alice",
        password: "alice",
        client_id: (process.env.REACT_APP_CLIENT ? process.env.REACT_APP_CLIENT : this.state.config.client)
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
    fhir,
    getAge
}