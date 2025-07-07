// Exemple générique, à adapter selon ton fournisseur
export async function verifyPaymentToken(token) {
  // Par exemple, faire une requête fetch vers l'API du fournisseur
  // avec le token et vérifier le statut de la transaction

  // Exemple fictif:
  const response = await fetch('https://api.paymentprovider.com/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await response.json();
  return data.status === 'success'; // vrai si payé
}
