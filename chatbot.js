// Constants and Types
const CONFIG = {
    API_KEY: 'AIzaSyBY2CRxpzDNDSBWv-C2hcaifZB86OgcFhQ',
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    SEARCH_KEYWORDS: ['koktejl', 'drink', 'pijača', 'zimska', 'recept', 'špricer'],
    MAX_MEMORY: 10,
    SYSTEM_PROMPT: `Si ljubljanski pomočnik za koktejle in uporabljaš ljubljanski sleng. Pri komunikaciji:
    1. Govori v ljubljanskem slengu
    2. Ko opisuješ recepte, jih napiši v lepem formatu:
       📝 IME DRINKA
       🥃 Sestavine:
       - sestavina 1
       - sestavina 2
       
       🔨 Priprava:
       1. prvi korak
       2. drugi korak
       
       💡 Fun fact: kšn zanimiv podatek
    3. Uporabljaj emoji-je za bolj sproščeno komunikacijo 🍸
    4. Če se sklicuješ na prejšnje pogovore, povej "kot sva že prej rekla..."
    5. Pri receptih uporabljaj neformalen ton ("vržeš not", "zmiksaš", "naštimaš")`
};

class ChatBot {
    constructor() {
        this.cocktailData = JSON.parse(localStorage.getItem('cocktailData')) || {};
        this.zimskaData = {};
        this.chatContainer = document.getElementById('chatContainer');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.conversationMemory = [];
        this.setupEventListeners(); // Fixed function name
    }

    static messageStyles = {
        user: 'message user',
        bot: 'message bot',
        recipe: 'message bot recipe'
    };

    async initialize() {
        await this.fetchZimskaData();
        this.addMessage("Živjo stari! 🤙 Sm tvoj novi kolega za drinke. Ful dobr poznam vse te koktejle pa zimske drinke. A rabiš kšn nasvet? 🍸", false);
    }

    async fetchZimskaData() {
        try {
            const response = await fetch('zimska.json');
            if (!response.ok) throw new Error('Ne morm dobit podatkov');
            this.zimskaData = await response.json();
            console.log('Zimski podatki so gor, vse štima! 👌');
        } catch (error) {
            console.error('Ups, neki je šlo narobe:', error);
            this.addMessage('Sori stari, podatkov o zimskih drinkah ne morm dobit, ampak loh se pa še zmer kej pametnga zmenva! 😅', false);
        }
    }

    formatRecipe(text) {
        if (text.includes('Sestavine:') || text.includes('Priprava:')) {
            const formattedText = text
                .replace(/\n/g, '<br>')
                .replace(/📝/g, '<strong class="recipe-title">📝')
                .replace(/🥃/g, '</strong><br><strong>🥃')
                .replace(/🔨/g, '</strong><br><strong>🔨')
                .replace(/💡/g, '</strong><br><strong>💡')
                .replace(/(-\s.*?)<br>/g, '<li>$1</li>')
                .replace(/(\d+\.\s.*?)<br>/g, '<li>$1</li>');
            return { isRecipe: true, text: formattedText };
        }
        return { isRecipe: false, text };
    }

    addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        const { isRecipe, text: formattedText } = this.formatRecipe(text);
        
        messageDiv.className = isRecipe ? 
            ChatBot.messageStyles.recipe : 
            (isUser ? ChatBot.messageStyles.user : ChatBot.messageStyles.bot);

        if (isRecipe) {
            messageDiv.innerHTML = formattedText;
        } else {
            messageDiv.textContent = text;
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

        if (this.conversationMemory.length >= CONFIG.MAX_MEMORY) {
            this.conversationMemory.shift();
        }
        this.conversationMemory.push({
            role: isUser ? "user" : "assistant",
            content: text
        });
    }

    async getGeminiResponse(prompt) {
        try {
            const combinedContext = {
                cocktails: this.cocktailData,
                zimska: this.zimskaData
            };

            const conversationContext = this.conversationMemory
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n');

            const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: CONFIG.SYSTEM_PROMPT },
                            { text: `Zgodovina pogovora:\n${conversationContext}\n\nPodatki k jih mam: ${JSON.stringify(combinedContext)}\n\nKaj je reku model: ${prompt}` }
                        ]
                    }]
                })
            });

            if (!response.ok) throw new Error('Ne dela API');
            
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 
                   'Sori stari, dans mi neki ne štima. Dej probej še enkrat! 😅';
        } catch (error) {
            console.error('Gemini je crknu:', error);
            throw new Error('Sori, dans mi ne dela najbolš. Probej jutr! 🤷‍♂️');
        }
    }

    searchDrinks(searchTerm) {
        const matchingCocktails = Object.entries(this.cocktailData)
            .filter(([name, data]) => 
                name.toLowerCase().includes(searchTerm) ||
                data.recept.some(ingredient => 
                    ingredient.toLowerCase().includes(searchTerm)
                )
            );

        const matchingZimska = Object.entries(this.zimskaData)
            .filter(([name, data]) => 
                name.toLowerCase().includes(searchTerm) ||
                (typeof data === 'object' && Object.values(data).some(value => 
                    value.toString().toLowerCase().includes(searchTerm)
                ))
            );

        return { matchingCocktails, matchingZimska };
    }

    async handleMessage(message) {
        if (!message.trim()) return;
        
        this.addMessage(message, true);
        
        try {
            const searchTerm = message.toLowerCase();
            const isSearchQuery = CONFIG.SEARCH_KEYWORDS.some(keyword => 
                searchTerm.includes(keyword)
            );

            if (isSearchQuery) {
                const { matchingCocktails, matchingZimska } = this.searchDrinks(searchTerm);
                
                const response = await this.getGeminiResponse(
                    `Povej mi več o "${message}". Najdu sm: ` +
                    `${matchingCocktails.length} koktejlov in ${matchingZimska.length} zimskih drinkov.`
                );
                
                this.addMessage(response);
            } else {
                const response = await this.getGeminiResponse(message);
                this.addMessage(response);
            }
        } catch (error) {
            console.error('Neki je šlo narobe:', error);
            this.addMessage('Sori model, neki ne štima. Dej probej še enkrat! 🤷‍♂️');
        }
    }

    setupEventListeners() { // Fixed function name
        this.sendButton.addEventListener('click', () => {
            const message = this.userInput.value.trim();
            if (message) {
                this.handleMessage(message);
                this.userInput.value = '';
            }
        });

        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendButton.click();
            }
        });
    }
}

// Initialize chatbot
const chatbot = new ChatBot();
chatbot.initialize();