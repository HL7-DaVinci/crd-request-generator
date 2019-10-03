import KJUR, { KEYUTIL } from 'jsrsasign';

async function createJwt(prvKeyObj, pubKeyObj) {
    const jwkPrv2 = KEYUTIL.getJWKFromKey(prvKeyObj);
    const jwkPub2 = KEYUTIL.getJWKFromKey(pubKeyObj);

    const currentTime = KJUR.jws.IntDate.get('now');
    const endTime = KJUR.jws.IntDate.get('now + 1day');
    const kid = KJUR.jws.JWS.getJWKthumbprint(jwkPub2)
    // const pubPem = {"pem":KEYUTIL.getPEM(pubKey),"id":kid};
    const pubPem = jwkPub2;
    pubPem.id = kid;

    // Check if the public key is already in the db
    const checkForPublic = await fetch("http://localhost:8080/ehr-server/reqgen/public/" + kid, {
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
        const alag = await fetch("http://localhost:8080/ehr-server/reqgen/public/", {
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
        "jti": this.makeid()
    }

    var sJWT = KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(body), jwkPrv2)

    return sJWT;
}

export {
    createJwt
}