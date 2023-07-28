import KJUR, { KEYUTIL } from 'jsrsasign';
import env from 'env-var';

function makeid() {
    var text = [];
    var possible = "---ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 25; i++)
        text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

    return text.join('');
}

function login() {

    const tokenUrl = (env.get('REACT_APP_AUTH').asString()) + "/realms/" + (env.get('REACT_APP_REALM').asString()) + "/protocol/openid-connect/token"
    let params = {
        grant_type: "password",
        username: (env.get('REACT_APP_USER').asString()),
        password: (env.get('REACT_APP_PASSWORD').asString()),
        client_id: (env.get('REACT_APP_CLIENT').asString())
    }

    // Encodes the params to be compliant with
    // x-www-form-urlencoded content type.
    const searchParams = Object.keys(params).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    // We get the token from the url
    return fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: searchParams
    });
}

function createJwt(keypair, baseUrl, cdsUrl) {
    console.log("creating jwt");
    const currentTime = KJUR.jws.IntDate.get('now');
    const endTime = KJUR.jws.IntDate.get('now + 1day');
    const kid = KJUR.jws.JWS.getJWKthumbprint(keypair.public)

    const header = {
        "alg": "RS256",
        "typ": "JWT",
        "kid": kid,
        "jku": (env.get('REACT_APP_PUBLIC_KEYS').asString())
    };
    const body = {
        "iss": baseUrl,
        "aud": cdsUrl,
        "iat": currentTime,
        "exp": endTime,
        "jti": makeid()
    }

    var sJWT = KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(body), keypair.private)
    return sJWT;
}

function setupKeys(callback) {
  const {prvKeyObj, pubKeyObj} = KEYUTIL.generateKeypair('RSA', 2048);
  const jwkPrv2 = KEYUTIL.getJWKFromKey(prvKeyObj);
  const jwkPub2 = KEYUTIL.getJWKFromKey(pubKeyObj);
  const kid = KJUR.jws.JWS.getJWKthumbprint(jwkPub2)

  const keypair = {
      private: jwkPrv2,
      public: jwkPub2,
      kid: kid
  }

  const pubPem = {
    "pem": jwkPub2,
    "id": kid
  };

  fetch(`${env.get('REACT_APP_PUBLIC_KEYS').asString()}/`, {
    "body": JSON.stringify(pubPem),
    "headers": {
        "Content-Type": "application/json"
    },
    "method": "POST"
  }).then((response) => {
      callback(keypair);
  }).catch((error) => {
      console.log(error);
  })
   
}

export {
    createJwt,
    login,
    setupKeys
}
