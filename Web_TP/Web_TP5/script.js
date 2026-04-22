// DOM Elements
const methodSelect = document.getElementById('method');
const urlInput = document.getElementById('url');
const sendBtn = document.getElementById('send-btn');
const headersContainer = document.getElementById('headers-container');
const addHeaderBtn = document.getElementById('add-header-btn');
const requestBodyInput = document.getElementById('request-body');
const responseMeta = document.getElementById('response-meta');
const responseBody = document.getElementById('response-body');

// Ajouter une nouvelle ligne d'en-tête
addHeaderBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML = `
                <input type="text" class="header-key" placeholder="Header key">
                <input type="text" class="header-value" placeholder="Header value">
                <button class="add-btn remove-header-btn" title="Supprimer cet en-tête">-</button>
            `;
    headersContainer.appendChild(row);

    // Gérer la suppression de la ligne
    row.querySelector('.remove-header-btn').addEventListener('click', () => {
        row.remove();
    });
});

// Extraire les en-têtes depuis l'interface
function getHeaders() {
    const headers = {};
    const rows = document.querySelectorAll('.header-row');
    rows.forEach(row => {
        const key = row.querySelector('.header-key').value.trim();
        const value = row.querySelector('.header-value').value.trim();
        if (key && value) {
            headers[key] = value;
        }
    });
    return headers;
}

// Envoyer la requête
sendBtn.addEventListener('click', async () => {
    const method = methodSelect.value;
    const url = urlInput.value.trim();
    const body = requestBodyInput.value;
    const headers = getHeaders();

    if (!url) {
        alert("Veuillez entrer une URL valide.");
        return;
    }

    // Préparation des options fetch
    const options = {
        method: method,
        headers: headers
    };

    // Ajouter le body uniquement si ce n'est pas une requête GET ou HEAD
    if (method !== 'GET' && method !== 'HEAD' && body) {
        options.body = body;
    }

    // UI Feedback
    responseMeta.textContent = "Chargement...";
    responseBody.textContent = "";
    sendBtn.textContent = "En cours...";
    sendBtn.disabled = true;

    try {
        const startTime = performance.now();
        const response = await fetch(url, options);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Récupérer le contenu de la réponse (JSON si possible, sinon texte)
        let dataText = await response.text();
        try {
            // Tenter de formater joliment si c'est du JSON
            const jsonData = JSON.parse(dataText);
            dataText = JSON.stringify(jsonData, null, 2);
        } catch (e) {
            // Garder en texte brut si ce n'est pas du JSON valide
        }

        // Affichage du statut et de la durée
        responseMeta.innerHTML = `
                    <strong>Status:</strong> ${response.status} ${response.statusText} <br>
                    <strong>Temps:</strong> ${duration} ms
                `;
        responseBody.textContent = dataText || "(Réponse vide)";

    } catch (error) {
        // Gestion des erreurs (ex: CORS, problème réseau)
        responseMeta.innerHTML = `<span style="color: red;"><strong>Erreur réseau</strong></span>`;
        responseBody.textContent = `Échec de la requête. \n\nRaison possible : \n- L'URL est incorrecte.\n- Pas de connexion internet.\n- Le serveur bloque la requête à cause des politiques CORS (Cross-Origin Resource Sharing).\n\nDétail : ${error.message}`;
    } finally {
        // Réinitialiser le bouton
        sendBtn.textContent = "Envoyer";
        sendBtn.disabled = false;
    }
});