// app/api/upload-image/route.js
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises'; // Utilisation de fs/promises pour les opérations asynchrones
import { v4 as uuidv4 } from 'uuid';

// Chemin absolu vers le dossier public/uploads
// Assurez-vous que process.cwd() pointe bien vers la racine de votre projet Next.js
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image'); // 'image' doit correspondre au nom du champ 'append'

        if (!file) {
            console.error("Upload Error: No file uploaded.");
            return NextResponse.json({ message: 'Aucun fichier téléchargé.' }, { status: 400 });
        }

        // Vérifier si le fichier est une instance de File
        if (!(file instanceof File)) {
            console.error("Upload Error: Provided 'file' is not a valid File object.");
            return NextResponse.json({ message: 'Type de fichier invalide.' }, { status: 400 });
        }

        console.log(`Attempting to upload file: ${file.name}, size: ${file.size} bytes`);
        console.log(`Target upload directory: ${uploadDir}`);

        // Crée le dossier d'upload s'il n'existe pas
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            console.log(`Upload directory created or already exists: ${uploadDir}`);
        } catch (mkdirError) {
            console.error("Error creating upload directory:", mkdirError);
            return NextResponse.json({ message: 'Erreur serveur lors de la création du dossier d\'upload.' }, { status: 500 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueSuffix = uuidv4() + path.extname(file.name);
        const filename = `image-${uniqueSuffix}`;
        const filePath = path.join(uploadDir, filename);

        try {
            await fs.writeFile(filePath, buffer);
            console.log(`File successfully written to: ${filePath}`);
        } catch (writeError) {
            console.error("Error writing file to disk:", writeError);
            return NextResponse.json({ message: 'Erreur serveur lors de l\'écriture du fichier sur le disque.' }, { status: 500 });
        }

        const imageUrl = `/uploads/${filename}`;
        console.log(`Image uploaded successfully. Accessible at URL: ${imageUrl}`);
        return NextResponse.json({ imageUrl }, { status: 200 });

    } catch (error) {
        console.error("General error during image upload process:", error);
        return NextResponse.json({ message: `Erreur interne du serveur lors de l'upload de l'image: ${error.message}` }, { status: 500 });
    }
}
