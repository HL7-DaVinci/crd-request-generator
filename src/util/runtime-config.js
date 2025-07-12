// Runtime environment configuration
// This module fetches environment variables from the server at runtime
// to support dynamic configuration in Docker containers

let runtimeEnvConfig = null;
let configPromise = null;

// Function to fetch runtime environment configuration from server
async function fetchRuntimeConfig() {
    if (configPromise) {
        return configPromise;
    }
    
    configPromise = (async () => {
        try {
            // Try to fetch from the current host
            const response = await fetch('/env-config');
            
            if (!response.ok) {
                console.warn('Failed to fetch runtime environment config:', response.status);
                return {};
            }
            
            const config = await response.json();
            runtimeEnvConfig = config;
            return config;
        } catch (error) {
            console.warn('Error fetching runtime environment config:', error);
            return {};
        }
    })();
    
    return configPromise;
}

// Function to get runtime environment variable
function getRuntimeEnvVar(key) {
    if (runtimeEnvConfig && runtimeEnvConfig[key]) {
        return runtimeEnvConfig[key];
    }
    return null;
}

// Function to check if runtime config is loaded
function isRuntimeConfigLoaded() {
    return runtimeEnvConfig !== null;
}

// Export functions
export {
    fetchRuntimeConfig,
    getRuntimeEnvVar,
    isRuntimeConfigLoaded
};
