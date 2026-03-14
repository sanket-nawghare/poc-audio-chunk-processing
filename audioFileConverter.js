const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { Readable } = require('stream');
const inputPath = './recordings/test.aac';

// Ensure the input file exists for the example
if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found at: ${inputPath}`);
    process.exit(1);
}

let totalChunks = 5;

function getChunk(chunk, buffer) {
    const chunkSize = Math.ceil(buffer.length / totalChunks);
    const chunkNumber = Number(chunk);
    const startIndex = (chunkNumber - 1) * chunkSize;
    const endIndex = Math.min(chunkNumber * chunkSize, buffer.length);
    chunkBuffer = buffer.subarray(startIndex, endIndex);

    return chunkBuffer
}

function convert(buffer) {
    ffmpeg(buffer)
        .toFormat('mp3') // Specify the output format
        .audioCodec('libmp3lame') // Specify the audio codec for MP3 encoding
        .save(`./${Date.now()}.mp3`) // Define the output path and start the conversion
        .on('error', (err) => {
            console.error('An error occurred: ' + err.message);
        })
        .on('end', () => {
            console.log('Conversion finished successfully!');
        });
}

async function start() {
    let audioData = await fs.readFileSync(inputPath);
    let audioBuffer = Buffer.from(audioData, 'base64');
    for (var i = 1; i < totalChunks; i++) {
        await new Promise(res => setTimeout(res, 500))
        let chunk = getChunk(i, audioBuffer);
        console.log(chunk);
        
        const inputStream = Readable.from(chunk);

        convert(inputStream);
    }

}
start();

