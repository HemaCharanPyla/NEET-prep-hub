const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
    res.json({
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        apiBaseUrl: 'https://openrouter.ai/api/v1',
        model: 'deepseek/deepseek-r1'
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEET Prep Hub server running on port ${PORT}`);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEET Prep Hub server running on port ${PORT}`);
});