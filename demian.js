const API_KEY = 'sk-proj-ZOvhypj3lM1ZefwkJPpBT3BlbkFJMOugpoZ8OQZOubprNfzu';
const GPT4O_API = 'https://api.groq.com/openai/v1/chat/completions';
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

async function getGPT4OResponse(value) {
    const promptValue = `Crie uma letra de trap de 8 versos sobre ${value} que rime, escrita em Português do Brasil. Certifique-se de que cada verso tenha entre 4 a 5 palavras para manter o ritmo do trap e a rima. A letra deve refletir o tema escolhido de maneira clara e envolvente, utilizando uma linguagem característica do gênero trap. Certifique-se também de que os versos rimem entre si. Por favor, não adicione nada além da letra em sua resposta. Apenas a letra.`;
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'model': 'gpt-4o',
            'messages': [{'role': 'user', 'content': promptValue}]
        })
    };
    try {
        const response = await fetch(GPT4O_API, options);
        const data = await response.json();
        console.log('GPT-4o API Response:', data);
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Unexpected response structure from GPT-4o API');
        }
        const content = data.choices[0].message.content.trim();
        return content.split('\n').filter(line => line.trim() !== '').slice(0, 8);
    } catch (error) {
        console.error('Error generating GPT-4o response:', error);
        return ['Erro: Falha ao gerar resposta'];
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
            const gpt4oResponse = await getGPT4OResponse(newValue);
            updateText(gpt4oResponse);
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
                getGPT4OResponse(currentValue).then(updateText);
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

init();
