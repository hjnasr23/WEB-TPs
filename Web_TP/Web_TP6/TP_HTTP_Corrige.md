# Chapitre 6 – Le Protocole HTTP : Travaux Pratiques

---

## TP 1 : Exploration avec les DevTools

### 1.2 – Observer une requête simple

**Code de statut :**
200 OK

**Headers de requête envoyés :**
- Host: httpbin.org
- User-Agent: Mozilla/5.0 ...
- Accept: text/html, application/xhtml+xml, */*
- Accept-Encoding: gzip, deflate, br
- Connection: keep-alive

**Content-Type de la réponse :**
application/json

### 1.3 – Tester différentes méthodes

| URL | Méthode | Code | Content-Type |
|-----|---------|------|--------------|
| httpbin.org/get | GET | 200 OK | application/json |
| httpbin.org/post | POST | 200 OK | application/json |
| httpbin.org/status/201 | GET | 201 Created | — |

---

## TP 2 : Maîtrise de cURL

### 2.1 – Différence entre `-i` et `-v`

`-i` affiche juste les headers de la réponse en plus du corps. Par exemple on voit le `HTTP/1.1 200 OK`, le `Content-Type`, etc., mais rien de plus.

`-v` c'est le mode verbose, il montre tout : les headers qu'on envoie (avec `>`), les headers qu'on reçoit (avec `<`), les détails de la connexion TCP, le handshake TLS si c'est HTTPS... Bref c'est utile quand on veut vraiment déboguer.

En résumé : `-i` pour voir la réponse complète, `-v` pour tout déboguer.

### 2.5 – Exercice avancé

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Custom-Header: MonHeader" \
  -d '{"action": "test", "value": 42}' \
  -i \
  https://httpbin.org/post
```

---

## TP 3 : API REST avec JavaScript

### Exercice – fetchWithRetry

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status >= 500) {
        throw new Error(`Erreur serveur : ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}
```

---

## TP 4 : Analyse des Headers de Sécurité

### Tableau des 3 sites analysés

| Site | HSTS | X-Frame-Options | CSP | Note |
|------|------|-----------------|-----|------|
| github.com | max-age=31536000 | DENY | Oui | A |
| google.com | max-age=10886400 | SAMEORIGIN | Partielle | B+ |
| wikipedia.org | max-age=106384710 | DENY | Oui | A |

---

## TP 5 : Cache HTTP

### Headers observés sur `/cache/60`

```
Cache-Control: public, max-age=60
ETag: "abc123..."
Expires: [date + 60s]
Last-Modified: [date]
```

### Requête conditionnelle avec ETag

On fait une première requête sur `/etag/test123`, le serveur répond 200 avec `ETag: "test123"`.

Ensuite on refait la requête avec `If-None-Match: test123`. Le serveur voit que rien n'a changé et répond **304 Not Modified**, sans renvoyer le corps. Le client utilise sa version en cache. C'est ce qui économise de la bande passante.

---

## Exercices Récapitulatifs

### Question 1 – `no-cache` vs `no-store`

`no-cache` : le navigateur peut stocker la réponse dans son cache, mais il **doit** revalider auprès du serveur avant de l'utiliser (via ETag / If-None-Match). Si le serveur dit que rien n'a changé → 304, et le cache est réutilisé.

`no-store` : le navigateur **ne stocke rien du tout**, ni en cache disque ni en mémoire. À chaque fois on retélécharge tout. C'est pour les données vraiment sensibles (relevés bancaires, données médicales...).

### Question 2 – Pourquoi POST n'est pas idempotent ?

Parce que chaque appel POST crée une nouvelle ressource. Si on envoie deux fois la même requête `POST /commandes`, on va créer deux commandes distinctes. Ce n'est pas le même résultat, donc c'est pas idempotent.

À l'opposé, `PUT /commandes/1` avec les mêmes données donnera toujours le même état final, peu importe combien de fois on l'appelle.

### Question 3 – Que se passe-t-il avec un code 301 ?

Le serveur répond avec `301 Moved Permanently` et un header `Location: nouvelle-url`. Le navigateur redirige automatiquement vers cette nouvelle URL.

La différence importante avec le 302 : le 301 est **permanent**, donc le navigateur met en cache la redirection. Les prochaines fois, il ira directement à la nouvelle URL sans même interroger l'ancienne. Les moteurs de recherche transfèrent aussi le référencement vers la nouvelle adresse.

### Question 4 – À quoi sert le header `Origin` ?

Il indique l'origine de la requête (schéma + domaine + port), par exemple `Origin: https://monsite.com`. Il est envoyé automatiquement par le navigateur pour les requêtes cross-origin (CORS).

Le serveur lit cet `Origin` et décide s'il autorise ou non la requête, en répondant avec `Access-Control-Allow-Origin`. Ce header ne peut pas être falsifié par JavaScript côté client, c'est pour ça qu'il sert de mécanisme de sécurité fiable.

### Question 5 – Pourquoi `HttpOnly` sur les cookies de session ?

Sans `HttpOnly`, du JavaScript malveillant injecté via une faille XSS peut lire `document.cookie` et voler le cookie de session. L'attaquant peut ensuite se faire passer pour l'utilisateur.

Avec `HttpOnly`, le cookie est complètement invisible pour JavaScript. Il est transmis uniquement dans les requêtes HTTP, automatiquement par le navigateur. Ça casse la chaîne d'exploitation XSS → vol de session.

En pratique on combine toujours : `HttpOnly` + `Secure` (HTTPS uniquement) + `SameSite=Strict`.
