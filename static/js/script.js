document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const modelSelect = document.getElementById('model-select');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    const contextWindowSlider = document.getElementById('context-window');
    const contextWindowValue = document.getElementById('context-window-value');

    // Variables d'état
    let isWaitingForResponse = false;
    let conversationContext = [];

    // Initialisation
    loadModels();
    setupEventListeners();

    function setupEventListeners() {
        // Envoi de message
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Paramètres
        settingsToggle.addEventListener('click', toggleSettings);
        temperatureSlider.addEventListener('input', function() {
            temperatureValue.textContent = this.value;
        });
        contextWindowSlider.addEventListener('input', function() {
            contextWindowValue.textContent = this.value;
        });
    }

    function toggleSettings() {
        settingsPanel.classList.toggle('active');
    }

    async function loadModels() {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            
            // Vider les options existantes
            modelSelect.innerHTML = '';
            
            // Ajouter les nouveaux modèles
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des modèles:', error);
        }
    }

    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${role}-message`);
        
        const metaDiv = document.createElement('div');
        metaDiv.classList.add('message-meta');
        metaDiv.textContent = role === 'user' ? 'Vous' : 'Assistant';
        
        const contentDiv = document.createElement('div');
        contentDiv.textContent = content;
        
        messageDiv.appendChild(metaDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Faire défiler vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }

    function addTypingIndicator() {
        const indicatorDiv = document.createElement('div');
        indicatorDiv.classList.add('message', 'ai-message');
        
        const metaDiv = document.createElement('div');
        metaDiv.classList.add('message-meta');
        metaDiv.textContent = 'Assistant';
        
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        
        indicatorDiv.appendChild(metaDiv);
        indicatorDiv.appendChild(typingDiv);
        chatMessages.appendChild(indicatorDiv);
        
        // Faire défiler vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return indicatorDiv;
    }

    async function sendMessage() {
        if (isWaitingForResponse) return;
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Ajouter le message de l'utilisateur
        addMessage('user', message);
        userInput.value = '';
        
        // Afficher l'indicateur de saisie
        const typingIndicator = addTypingIndicator();
        isWaitingForResponse = true;
        
        try {
            const model = modelSelect.value;
            const temperature = temperatureSlider.value;
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: message,
                    model: model,
                    temperature: temperature,
                    context: conversationContext
                })
            });
            
            const data = await response.json();
            
            // Supprimer l'indicateur de saisie
            chatMessages.removeChild(typingIndicator);
            
            if (data.error) {
                addMessage('ai', `Erreur: ${data.error}`);
            } else {
                addMessage('ai', data.response);
                // Mettre à jour le contexte pour la prochaine requête
                if (data.context) {
                    conversationContext = data.context;
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            chatMessages.removeChild(typingIndicator);
            addMessage('ai', `Une erreur s'est produite: ${error.message}`);
        } finally {
            isWaitingForResponse = false;
        }
    }
});
