# n8n-nodes-conexteo

Ce module communautaire (Community Node) non-officiel permet d'intégrer l'API **Conexteo** directement dans vos workflows [n8n](https://n8n.io/). 

Il vous permet d'envoyer des campagnes SMS/RCS, de gérer vos listes de contacts, et d'écouter les réponses de vos clients en temps réel.

## 🌟 Fonctionnalités

* **SMS & RCS :** Envoyez des messages simples ou du Rich Communication Services.
* **Gestion des Contacts :** Créez des listes et ajoutez/mettez à jour des contacts (synchronisation parfaite avec des outils comme Shopify, WooCommerce, etc.).
* **Trigger (Webhook) :** Déclenchez automatiquement un workflow lorsqu'un client répond à un SMS/RCS, avec la possibilité de filtrer par mots-clés (ex: STOP, OUI, INFO).

## 🔐 Configuration des identifiants (Credentials)

Pour utiliser ce nœud, vous devez posséder un compte Conexteo.

1. Connectez-vous à votre espace [Conexteo](https://www.conexteo.com/).
2. Récupérez votre **Clé API** dans vos paramètres développeur.
3. Dans n8n, ajoutez de nouveaux identifiants (`Conexteo API`) et collez votre clé.

## 🚀 Comment l'utiliser (Trigger Webhook)

Pour écouter les réponses de vos clients :
1. Ajoutez le nœud **Conexteo Trigger** sur votre canevas n8n.
2. Copiez l'URL de Production générée par le nœud.
3. Collez cette URL dans votre interface Conexteo (section *Webhooks > Réponses > POST*).
4. Activez votre workflow n8n.

## 📜 Licence

Ce projet est sous licence [MIT](LICENSE.md).