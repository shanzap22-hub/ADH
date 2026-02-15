const https = require('https');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error('Missing API Key');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.error('API Error:', json.error);
                } else {
                    console.log('Available Models:');
                    json.models.forEach(model => {
                        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                            console.log(`- ${model.name}`);
                        }
                    });
                }
            } catch (e) {
                console.error('Parse Error:', e.message);
                console.log('Raw Data:', data);
            }
        });

    }).on('error', (err) => {
        console.error('Request Error:', err.message);
    });
}

listModels();
