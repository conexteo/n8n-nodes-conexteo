# n8n-nodes-conexteo

Ce module communautaire (Community Node) non-officiel permet d'intégrer l'API **Conexteo** directement dans vos workflows [n8n](https://n8n.io/). 

Il vous permet d'envoyer des campagnes SMS/RCS, de gérer vos listes de contacts, et d'écouter les réponses de vos clients en temps réel.

## 🌟 Fonctionnalités

* **SMS & RCS :** Envoyez des messages simples ou du Rich Communication Services.
* **Gestion des Contacts :** Créez des listes et ajoutez/mettez à jour des contacts (synchronisation parfaite avec des outils comme Shopify, WooCommerce, etc.).
* **Réponses proposées RCS :** Ajoutez des boutons « Réponse proposée » (texte, carte, carrousel) avec une valeur postback restituée par le trigger.
* **Trigger (Webhook) :** Déclenchez un workflow sur une réponse SMS/RCS (clic sur un bouton RCS compris), un accusé de réception SMS ou un statut RCS (remis, lu, échec, bascule en SMS). Signature des webhooks vérifiée, filtre par mots-clés (ex: STOP, OUI, INFO).

## 🔐 Configuration des identifiants (Credentials)

Pour utiliser ce nœud, vous devez posséder un compte Conexteo.

1. Connectez-vous à votre espace [Conexteo](https://www.conexteo.com/).
2. Récupérez votre **Clé API** dans vos paramètres développeur.
3. Dans n8n, ajoutez de nouveaux identifiants (`Conexteo API`) et collez votre clé.
4. Facultatif mais recommandé : collez aussi le **secret de signature des webhooks** (`whsec_…`), voir ci-dessous.

## 🚀 Comment l'utiliser (Trigger Webhook)

1. Ajoutez le nœud **Conexteo Trigger** sur votre canevas n8n et choisissez le **type d'événement** : réponse SMS/RCS, accusé de réception SMS ou statut RCS.
2. Copiez l'URL de Production générée par le nœud.
3. Dans votre espace Conexteo (*Développeurs > Webhooks*), collez cette URL dans le champ du même type.
4. Activez le **mode signé** et copiez le secret `whsec_…` : il n'est affiché qu'une fois. Collez-le dans le champ « Secret de signature des webhooks » de l'identifiant `Conexteo API`, puis rattachez cet identifiant au trigger.
5. Activez votre workflow n8n.

Un trigger par type d'événement : Conexteo n'accepte qu'une URL par type. Si vous collez la même URL dans plusieurs champs, choisissez le type « Tous ».

### Pourquoi le mode signé

* Un webhook signé est **réessayé** en cas d'échec (jusqu'à 8 fois sur environ 18 heures) ; un webhook non signé n'est envoyé qu'une fois.
* Le nœud **refuse** (401) tout appel dont la signature ne correspond pas : personne d'autre que Conexteo ne peut déclencher votre workflow.
* Les réponses RCS sont plus détaillées : `reply_kind` (`button` = réponse proposée, `action` = lien/appel, `text` = texte libre), `choice_label`, `postback_data`.
* Les statuts RCS n'existent qu'en mode signé.

Sans secret renseigné, le trigger accepte les webhooks non signés, comme dans les versions 1.0.x.

### Données en sortie (mode signé)

Les champs de l'événement sont à plat (`recipient`, `content`, `channel`, `message_id`, `deliver`, `status`…), complétés par `event` (ex. `reply.sms`, `sms.deliver_report`, `rcs.read`), `webhook_type`, `webhook_id` (identique entre les tentatives d'un même événement : utile pour dédoublonner), `created_at` et `signature_verified`.

## 📜 Licence

Ce projet est sous licence [MIT](LICENSE.md).