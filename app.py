from flask import Flask, render_template, request, jsonify
import requests
import json

app = Flask(__name__)

# Configuration - modifiez selon votre installation Ollama
OLLAMA_API_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama2"  # Modèle par défaut

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        model = data.get('model', DEFAULT_MODEL)
        
        # Options pour la requête à Ollama
        options = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        # Ajouter des paramètres optionnels s'ils sont présents
        if 'temperature' in data:
            options['options'] = {
                'temperature': float(data['temperature'])
            }
        
        # Envoyer la requête à l'API Ollama
        response = requests.post(
            OLLAMA_API_URL,
            json=options,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            response_data = response.json()
            return jsonify({
                'response': response_data.get('response', ''),
                'context': response_data.get('context', []),
                'done': response_data.get('done', False)
            })
        else:
            return jsonify({'error': f"Erreur Ollama: {response.text}"}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    try:
        # Cette endpoint suppose que vous avez Ollama fonctionnant localement
        response = requests.get("http://localhost:11434/api/tags")
        if response.status_code == 200:
            models_data = response.json()
            return jsonify({'models': models_data.get('models', [])})
        else:
            return jsonify({'models': [DEFAULT_MODEL]})  # Fallback
    except:
        return jsonify({'models': [DEFAULT_MODEL]})  # Fallback si Ollama n'est pas accessible

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
