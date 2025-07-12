require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'db.json');
const isDevelopment = process.env.NODE_ENV !== 'production';

// Development webpack middleware
if (isDevelopment) {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const webpackConfig = require('./webpack.config.js');
    
    // Modify webpack config for hot reloading
    webpackConfig.entry = [
        'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
        webpackConfig.entry
    ];
    webpackConfig.plugins = webpackConfig.plugins || [];
    webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
    
    const compiler = webpack(webpackConfig);
    
    // Use webpack dev middleware
    app.use(webpackDevMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath || '/',
        stats: {
            colors: true,
            chunks: false,
            modules: false,
            hash: false,
            timings: true
        }
    }));
    
    // Use webpack hot middleware
    app.use(webpackHotMiddleware(compiler, {
        log: console.log,
        path: '/__webpack_hmr',
        heartbeat: 10 * 1000
    }));
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data file if it doesn't exist
function initializeData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initialData = {
                public_keys: []
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        }
    } catch (error) {
        console.error('Error initializing data file:', error);
    }
}

// Read data from file
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { public_keys: [] };
    } catch (error) {
        console.error('Error reading data file:', error);
        return { public_keys: [] };
    }
}

// Write data to file
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data file:', error);
    }
}

// Initialize data on startup
initializeData();

// Routes
// GET /public_keys - Get all public keys
app.get('/public_keys', (req, res) => {
    try {
        const data = readData();
        res.json(data.public_keys);
    } catch (error) {
        console.error('Error getting public keys:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /public_keys - Add a new public key
app.post('/public_keys', (req, res) => {
    try {
        const data = readData();
        const newKey = req.body;
        
        // Add timestamp if not present
        if (!newKey.timestamp) {
            newKey.timestamp = new Date().toISOString();
        }
        
        // Add the new key
        data.public_keys.push(newKey);
        
        // Write back to file
        writeData(data);
        
        res.status(201).json(newKey);
    } catch (error) {
        console.error('Error adding public key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /public_keys/:id - Get a specific public key by ID
app.get('/public_keys/:id', (req, res) => {
    try {
        const data = readData();
        const key = data.public_keys.find(k => k.id === req.params.id);
        
        if (!key) {
            return res.status(404).json({ error: 'Public key not found' });
        }
        
        res.json(key);
    } catch (error) {
        console.error('Error getting public key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /public_keys/:id - Delete a specific public key by ID
app.delete('/public_keys/:id', (req, res) => {
    try {
        const data = readData();
        const keyIndex = data.public_keys.findIndex(k => k.id === req.params.id);
        
        if (keyIndex === -1) {
            return res.status(404).json({ error: 'Public key not found' });
        }
        
        const deletedKey = data.public_keys.splice(keyIndex, 1)[0];
        writeData(data);
        
        res.json(deletedKey);
    } catch (error) {
        console.error('Error deleting public key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Environment configuration endpoint for frontend
app.get('/env-config', (req, res) => {
    try {
        const envConfig = {
            REACT_APP_EHR_SERVER: process.env.REACT_APP_EHR_SERVER || null,
            REACT_APP_CDS_SERVICE: process.env.REACT_APP_CDS_SERVICE || null,
            REACT_APP_ORDER_SELECT: process.env.REACT_APP_ORDER_SELECT || null,
            REACT_APP_ORDER_SIGN: process.env.REACT_APP_ORDER_SIGN || null,
            REACT_APP_LAUNCH_URL: process.env.REACT_APP_LAUNCH_URL || null,
            REACT_APP_FORM_EXPIRATION_DAYS: process.env.REACT_APP_FORM_EXPIRATION_DAYS || null,
            REACT_APP_ALTERNATIVE_THERAPY: process.env.REACT_APP_ALTERNATIVE_THERAPY || null,
            REACT_APP_PUBLIC_KEYS: process.env.REACT_APP_PUBLIC_KEYS || null,
            REACT_APP_CLIENT: process.env.REACT_APP_CLIENT || null,
            NODE_ENV: process.env.NODE_ENV || 'development'
        };
        
        // Remove null values to avoid overriding config file values
        Object.keys(envConfig).forEach(key => {
            if (envConfig[key] === null) {
                delete envConfig[key];
            }
        });
        
        res.json(envConfig);
    } catch (error) {
        console.error('Error getting environment config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'build')));
    
    // Handle React routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Data file: ${DATA_FILE}`);
    if (isDevelopment) {
        console.log('Webpack dev middleware enabled for hot reloading');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});
