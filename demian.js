const API_KEY = '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';
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const VALUE_FETCH_API = 'https://11z.co/_w/5156/selection';
let currentValue = '';

function loadWebFontScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadFont() {
    return new Promise((resolve, reject) => {
        if (typeof WebFont === 'undefined') {
            loadWebFontScript().then(() => {
                WebFont.load({
                    google: {
                        families: ['Indie Flower']
                    },
                    active: resolve,
                    inactive: reject
                });
            }).catch(reject);
        } else {
            WebFont.load({
                google: {
                    families: ['Indie Flower']
                },
                active: resolve,
                inactive: reject
            });
        }
    });
}

async function fetchNewValue() {
    try {
        const response = await fetch(VALUE_FETCH_API);
        const data = await response.json();
        return data.value;
    } catch (error) {
        console.error('Error fetching new value:', error);
        return null;
    }
}

async function getGroqResponse(value) {
    const promptValue = `Crie um poema de 8 versos sobre um(a) ${value}. Cada verso deve ser curto, com aproximadamente 4-5 palavras. O poema deve seguir o estilo de rap e todas as frases devem rimar.`;
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'model': 'llama3-8b-8192',
            'messages': [{'role': 'user', 'content': promptValue}]
        })
    };
    try {
        const response = await fetch(GROQ_API, options);
        const data = await response.json();
        console.log('Groq API Response:', data);
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Unexpected response structure from Groq API');
        }
        const content = data.choices[0].message.content.trim();
        return content.split('\n').filter(line => line.trim() !== '').slice(0, 8);
    } catch (error) {
        console.error('Error generating Groq response:', error);
        return ['Error: Failed to generate response'];
    }
}

function updateText(lines) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const image = document.getElementById('image');
    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const baseFontSize = 20;
    const fontSize = Math.max(baseFontSize * (canvas.width / 800), 10);
    
    ctx.font = `${fontSize}px 'Indie Flower'`;
    ctx.fillStyle = 'rgb(0, 15, 85)';
    ctx.textAlign = 'center';
    
    const lineHeight = fontSize * 1.5;
    const x = canvas.width * 0.4;
    let y = canvas.height * 0.38;
    lines.forEach(line => {
        ctx.fillText(line.trim(), x, y);
        y += lineHeight;
    });
}

async function checkForNewValue() {
    try {
        const newValue = await fetchNewValue();
        console.log('Fetched new value:', newValue);
        if (newValue && newValue !== currentValue && !newValue.toLowerCase().startsWith('http')) {
            currentValue = newValue;
            const groqResponse = await getGroqResponse(newValue);
            updateText(groqResponse);
        } else {
            console.log('No new non-HTTP value to process');
        }
    } catch (error) {
        console.error('Error in checkForNewValue:', error);
    }
}

async function init() {
    try {
        await loadFont();
        console.log('Font loaded successfully');
        
        // Apply the font to the canvas immediately
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `20px 'Indie Flower'`;
        
        setInterval(checkForNewValue, 5000);
        window.addEventListener('resize', () => {
            if (currentValue) {
                getGroqResponse(currentValue).then(updateText);
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

init();
