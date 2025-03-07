import https from 'https';
import fs from 'fs';
import path from 'path';

const url = 'https://avatars.githubusercontent.com/u/111954195?s=400&u=e673c5d81a2de5018455e36a917eb83a38569404&v=4';
const outputDir = path.join(process.cwd(), 'static', 'images');
const outputPath = path.join(outputDir, 'lionweb-logo.png');

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

https.get(url, (response) => {
    const fileStream = fs.createWriteStream(outputPath);
    response.pipe(fileStream);
    
    fileStream.on('finish', () => {
        fileStream.close();
        console.log('Logo downloaded successfully!');
    });
}).on('error', (err) => {
    console.error('Error downloading logo:', err.message);
}); 