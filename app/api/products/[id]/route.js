// app/api/products/[id]/route.js

import pool from '../../../../lib/db'; // Adjust this path if necessary
import { NextResponse } from 'next/server';

// GET: Retrieve a product by its ID
export async function GET(req, context) {
    const { id } = context.params; // Get product ID from dynamic URL parameters

    if (!id) {
        return NextResponse.json({ success: false, message: 'Product ID is missing.' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
        }

        // Return the first product found (should be unique by ID)
        return NextResponse.json({ success: true, product: rows[0] }, { status: 200 });

    } catch (error) {
        console.error('Error fetching product by ID:', error);
        return NextResponse.json({ success: false, message: `Server error fetching product: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// PUT: Update a product by its ID
export async function PUT(req, context) {
    const { id } = context.params; // Get product ID from dynamic URL parameters
    const { name, description, category, price, offerPrice, stock, imgUrl } = await req.json();

    if (!id) {
        return NextResponse.json({ success: false, message: 'Product ID is missing.' }, { status: 400 });
    }
    if (!name || !description || !category || price === undefined || stock === undefined || !imgUrl) {
        return NextResponse.json({ success: false, message: 'Missing required fields for update.' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Convert imgUrl array to JSON string for database storage
        // Ensure offerPrice is stored as NULL if empty or 0, otherwise as a float
        const finalOfferPrice = offerPrice !== null && offerPrice !== '' && parseFloat(offerPrice) > 0 ? parseFloat(offerPrice) : null;

        const [result] = await connection.execute(
            `UPDATE products SET name = ?, description = ?, category = ?, price = ?, offerPrice = ?, stock = ?, imgUrl = ?, updatedAt = NOW() WHERE id = ?`,
            [name, description, category, parseFloat(price), finalOfferPrice, parseInt(stock), imgUrl, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Product not found or no changes made.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Product updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ success: false, message: `Server error updating product: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


// DELETE: Delete a product by its ID
export async function DELETE(req, context) {
    const { id } = context.params; // Get product ID from dynamic URL parameters

    if (!id) {
        return NextResponse.json({ success: false, message: 'Product ID is missing.' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Delete the product from the 'products' table
        const [result] = await connection.execute(
            `DELETE FROM products WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            // If no rows were affected, the product was not found
            return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
        }

        // OPTIONAL: If you have linked tables (e.g., cart_items, order_items),
        // ensure you have foreign key constraints with ON DELETE CASCADE
        // or manually delete linked entries here.
        // Example (if you don't have ON DELETE CASCADE on cart_items and order_items):
        // await connection.execute(`DELETE FROM cart_items WHERE productId = ?`, [id]);
        // await connection.execute(`DELETE FROM order_items WHERE productId = ?`, [id]);

        return NextResponse.json({ success: true, message: 'Product deleted successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Error deleting product:', error);
        // Handle specific errors, e.g., if foreign keys block deletion
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return NextResponse.json({ success: false, message: 'Cannot delete product because it is linked to existing orders or carts. Please remove it from carts/orders first or configure ON DELETE CASCADE.' }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ success: false, message: `Server error during deletion: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
