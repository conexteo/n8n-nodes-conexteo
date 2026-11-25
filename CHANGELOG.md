# Changelog

## 1.1.0

### Conexteo Trigger
- Webhooks signés : vérification de `X-Conexteo-Signature` (HMAC-SHA256, tolérance de 5 minutes) avec le secret `whsec_…` renseigné dans l'identifiant Conexteo API. Appel refusé (401) si la signature ne correspond pas.
- Nouveau paramètre « Type d'événement » : réponse SMS/RCS, accusé de réception SMS, statut RCS, ou tous.
- Format signé pris en charge : les champs de l'événement sortent à plat, avec `event`, `webhook_type`, `webhook_id`, `created_at` et `signature_verified`.
- Clics sur les boutons RCS : le filtre de mots-clés lit aussi `choice_label` et `postback_data`.
- Statuts opérateur intermédiaires des SMS ignorés par défaut.
- Les webhooks non signés (ancien format) restent acceptés tant qu'aucun secret n'est renseigné.

### Conexteo
- Boutons « Réponse proposée » sur la carte et le carrousel RCS, avec valeur postback facultative.
- Boutons (10 au plus) sous le RCS texte.

## 1.0.4

- Première version publiée.
