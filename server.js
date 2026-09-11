import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.static(__dirname));

app.post('/analyze', upload.single('chart'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image!' });
    }

    const base64Image = req.file.buffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64Image,
          },
        },
        `Act as an expert technical analyst and candlestick pattern specialist. Analyze this candlestick chart screenshot:
         1. Identify key candlestick patterns and trend.
         2. Highlight key support and resistance levels.
         3. Predict probable next candle movement with clear technical reasoning.
         4. Give a brief risk notice at the end.`
      ],
    });

    res.json({ analysis: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze chart.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));