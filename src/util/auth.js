import KJUR, { KEYUTIL } from 'jsrsasign';
import config from '../config.js';
import { getConfigValue } from './data.js';

function makeid() {
    var text = [];
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    for (var i = 0; i < 128; i++)
        text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

    return text.join('');
}

// SMART on FHIR endpoint discovery
async function discoverSmartEndpoints(fhirBaseUrl) {
    try {        // First try to get the SMART configuration from .well-known/openid-configuration
        const smartConfigUrl = `${fhirBaseUrl}/.well-known/openid-configuration`;
        let response = await fetch(smartConfigUrl);
        
        if (response.ok) {
            const smartConfig = await response.json();
            return {
                authorizationEndpoint: smartConfig.authorization_endpoint,
                tokenEndpoint: smartConfig.token_endpoint,
                introspectionEndpoint: smartConfig.introspection_endpoint,
                revocationEndpoint: smartConfig.revocation_endpoint
            };
        }
        
        // Fallback: Try to get SMART endpoints from FHIR metadata
        const metadataUrl = `${fhirBaseUrl}/metadata`;
        response = await fetch(metadataUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch FHIR metadata: ${response.status}`);
        }
        
        const metadata = await response.json();
        
        // Look for SMART extensions in the CapabilityStatement
        const smartExtensions = metadata.rest?.[0]?.security?.extension?.find(
            ext => ext.url === 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris'
        );
        
        if (!smartExtensions) {
            throw new Error('SMART on FHIR extensions not found in metadata');
        }
        
        const endpoints = {};
        smartExtensions.extension?.forEach(ext => {
            switch (ext.url) {
                case 'authorize':
                    endpoints.authorizationEndpoint = ext.valueUri;
                    break;
                case 'token':
                    endpoints.tokenEndpoint = ext.valueUri;
                    break;
                case 'introspect':
                    endpoints.introspectionEndpoint = ext.valueUri;
                    break;
                case 'revoke':
                    endpoints.revocationEndpoint = ext.valueUri;
                    break;
            }
        });
        
        if (!endpoints.authorizationEndpoint || !endpoints.tokenEndpoint) {
            throw new Error('Required SMART endpoints not found in metadata');
        }
        
        return endpoints;
        
    } catch (error) {
        console.error('Error discovering SMART endpoints:', error);
        throw new Error(`SMART endpoint discovery failed: ${error.message}`);
    }
}

async function checkAuthRequired(ehrServer) {
    try {
        // Try to access the Patient endpoint without authentication
        const response = await fetch(`${ehrServer}/Patient?_summary=count`, {
            method: "GET",
            headers: {
                "Accept": "application/fhir+json"
            }
        });
        
        // If we get a successful response (200) or any non-401/403, auth is not required
        if (response.status !== 401 && response.status !== 403) {
            return false; // Authentication not required
        }
        
        return true; // Authentication required
    } catch (error) {
        console.log("Error checking auth requirements:", error);
        return true; // Assume auth is required if there's an error
    }
}

// Helper function to generate code challenge for PKCE
function generateCodeChallenge(codeVerifier) {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    // Generate SHA256 hash
    return crypto.subtle.digest('SHA-256', data).then(buffer => {
        // Convert to base64url
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    });
}

async function performOAuthAuthorizationFlow() {
    const ehrServer = getConfigValue('ehrUrl', 'REACT_APP_EHR_SERVER', 'ehr_server');
    const clientId = getConfigValue('client', 'REACT_APP_CLIENT', 'client');
    
    try {
        // Discover SMART endpoints from the FHIR server
        const smartEndpoints = await discoverSmartEndpoints(ehrServer);
        
        const redirectUri = window.location.origin;
        
        // Generate state and code verifier for PKCE (recommended for public clients)
        const state = makeid();
        const codeVerifier = makeid();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        
        // Store these for later use, including the token endpoint
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('code_verifier', codeVerifier);
        sessionStorage.setItem('token_endpoint', smartEndpoints.tokenEndpoint);
        
        const authParams = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: 'launch patient/*.read',
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            aud: ehrServer
        });
        
        // Redirect to authorization server
        window.location.href = `${smartEndpoints.authorizationEndpoint}?${authParams}`;
        
        // This won't return normally due to redirect, but return a promise for consistency
        return Promise.reject(new Error('Redirecting to authorization server'));
        
    } catch (error) {
        console.error('OAuth authorization flow error:', error);
        throw new Error(`OAuth authorization failed: ${error.message}`);
    }
}

async function exchangeCodeForToken(code, state) {
    const clientId = getConfigValue('client', 'REACT_APP_CLIENT', 'client');
    const redirectUri = window.location.origin;
    
    // Verify state matches
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
        throw new Error('Invalid state parameter');
    }
    
    const codeVerifier = sessionStorage.getItem('code_verifier');
    const tokenEndpoint = sessionStorage.getItem('token_endpoint');
    
    if (!tokenEndpoint) {
        throw new Error('Token endpoint not found in session storage');
    }
    
    const params = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
    };
    
    const searchParams = Object.keys(params).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    
    // Clean up stored values
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('token_endpoint');
    
    return fetch(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: searchParams
    });
}

async function login() {
    const ehrServer = getConfigValue('ehrUrl', 'REACT_APP_EHR_SERVER', 'ehr_server');
    
    // First check if authentication is required
    const authRequired = await checkAuthRequired(ehrServer);
    
    if (!authRequired) {
        // Return a mock response with empty token if no auth is needed
        return Promise.resolve({
            json: () => Promise.resolve({ access_token: "" })
        });
    }
      // If authentication is required, perform OAuth authorization flow
    return performOAuthAuthorizationFlow();
}

function createJwt(keypair, baseUrl, cdsUrl) {
    console.log("creating jwt");
    const currentTime = KJUR.jws.IntDate.get('now');
    const endTime = KJUR.jws.IntDate.get('now + 1day');
    const kid = KJUR.jws.JWS.getJWKthumbprint(keypair.public);

    const header = {
        "alg": "RS256",
        "typ": "JWT",
        "kid": kid,
        "jku": getConfigValue('publicKeys', 'REACT_APP_PUBLIC_KEYS', 'public_keys')
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

  fetch(`${getConfigValue('publicKeys', 'REACT_APP_PUBLIC_KEYS', 'public_keys')}/`, {
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

function checkOAuthCallbackError(urlParams) {
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const errorUri = urlParams.get('error_uri');
    
    if (error) {
        const errorInfo = {
            error: error,
            description: errorDescription || 'Unknown OAuth error',
            uri: errorUri
        };
        
        // Clean up any stored OAuth state since the flow failed
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('code_verifier');
        sessionStorage.removeItem('token_endpoint');
        
        return errorInfo;
    }
    
    return null;
}

export {
    createJwt,
    login,
    setupKeys,
    checkAuthRequired,
    performOAuthAuthorizationFlow,
    exchangeCodeForToken,
    checkOAuthCallbackError,
    discoverSmartEndpoints
}
