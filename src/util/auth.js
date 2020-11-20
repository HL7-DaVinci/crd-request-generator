import KJUR, { KEYUTIL } from 'jsrsasign';
import config from '../properties.json';

function makeid() {
    var text = [];
    var possible = "---ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 25; i++)
        text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

    return text.join('');
}

function login() {

    const tokenUrl = config.auth + "/realms/" + config.realm + "/protocol/openid-connect/token"
    let params = {
        grant_type: "password",
        username: config.user,
        password: config.password,
        client_id: config.client
    }

    // Encodes the params to be compliant with
    // x-www-form-urlencoded content type.
    const searchParams = Object.keys(params).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    // We get the token from the url
    console.log("auth::login(): fetch the token from: " + tokenUrl);
    return fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: searchParams
    });
}

async function createJwt(prvKeyObj, pubKeyObj, baseUrl) {
    console.log("creating jwt");
    const jwkPrv2 = KEYUTIL.getJWKFromKey(prvKeyObj);
    const jwkPub2 = KEYUTIL.getJWKFromKey(pubKeyObj);

    const currentTime = KJUR.jws.IntDate.get('now');
    const endTime = KJUR.jws.IntDate.get('now + 1day');
    const kid = KJUR.jws.JWS.getJWKthumbprint(jwkPub2)
    // const pubPem = {"pem":KEYUTIL.getPEM(pubKey),"id":kid};
    const pubPem = jwkPub2;
    pubPem.id = kid;
    // Check if the public key is already in the db
    const checkForPublic = await fetch(baseUrl + "/reqgen/public/" + kid, {
        "headers": {
            "Content-Type": "application/json"
        },
        "method": "GET"
    }).then((response) => {
        if(response.status !==200) {
            // problem!
            return false;
        }else{
            return response.json();
        }
    }).catch(response => {console.log(response)});
    if (!checkForPublic) {
        // POST key to db if it's not already there
        const alag = await fetch(baseUrl + "/reqgen/public/", {
            "body": JSON.stringify(pubPem),
            "headers": {
                "Content-Type": "application/json"
            },
            "method": "POST"
        });
    }
    const header = {
        "alg": "RS256",
        "typ": "JWT",
        "kid": kid,
        "jku": window.location.href + "/public"
    };
    const body = {
        "iss": "localhost:3000",
        "aud": "r4/order-review-services",
        "iat": currentTime,
        "exp": endTime,
        "jti": makeid()
    }

    var sJWT = KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(body), jwkPrv2)
    return sJWT;
}

export {
    createJwt,
    login
}
