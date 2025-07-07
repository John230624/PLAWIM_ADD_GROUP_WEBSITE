// pages/api/products/index.js
import pool from '../../../lib/db'; // Ajuste le chemin si ton dossier lib est ailleurs

export default async function handler(req, res) {
  let connection; // Déclare la connexion en dehors du try pour la gérer dans le finally

  try {
    connection = await pool.getConnection(); // Obtiens une connexion depuis le pool

    // Gérer la requête GET : Récupérer tous les produits
    if (req.method === 'GET') {
      const [rows] = await connection.execute('SELECT * FROM products');
      res.status(200).json(rows);
    }
    // Gérer la requête POST : Créer un nouveau produit
    else if (req.method === 'POST') {
      const { name, description, price, imageUrl, stock, categoryId } = req.body;

      // Validation basique des données
      if (!name || !price) {
        return res.status(400).json({ message: 'Le nom et le prix sont requis.' });
      }
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ message: 'Le prix doit être un nombre positif.' });
      }
      if (stock !== undefined && (isNaN(stock) || stock < 0)) {
        return res.status(400).json({ message: 'Le stock doit être un nombre positif ou zéro.' });
      }

      const [result] = await connection.execute(
        'INSERT INTO products (name, description, price, imageUrl, stock, categoryId) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description || null, parseFloat(price), imageUrl || null, parseInt(stock) || 0, categoryId || null]
      );

      // Pour MySQL, result.insertId est l'ID auto-incrémenté.
      // Puisque nous utilisons UUID(), il faut faire une autre requête pour récupérer le produit par son ID (UUID généré)
      // Ou bien, on peut simplement retourner un message de succès
      res.status(201).json({ message: 'Produit créé avec succès', insertId: result.insertId });

    }
    // Gérer les autres méthodes HTTP non autorisées
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Méthode ${req.method} non autorisée`);
    }
  } catch (error) {
    console.error('Erreur dans l\'API des produits:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.', error: error.message });
  } finally {
    if (connection) connection.release(); // Relâche la connexion dans le pool
  }
}