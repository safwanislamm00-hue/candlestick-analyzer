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

app.use(express.static(__dirname));

app.post('/analyze', upload.single('chart'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'অনুগ্রহ করে একটি ছবি আপলোড করুন!' });
    }

    const userApiKey = req.headers['x-api-key'];
    const activeApiKey = (userApiKey && userApiKey.trim() !== '') ? userApiKey : process.env.GEMINI_API_KEY;

    if (!activeApiKey) {
      return res.status(400).json({ error: 'কোনো API Key পাওয়া যায়নি! Settings থেকে আপনার Key যোগ করুন।' });
    }

    const ai = new GoogleGenAI({ apiKey: activeApiKey });
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
        `You are a professional price action trader and technical analyst. Analyze this candlestick chart image carefully to avoid fake signals.
        
        Strict Guidelines:
        1. FIRST LINE MUST BE strictly one of these choices (in English):
           - "RECOMMENDATION: UP"
           - "RECOMMENDATION: DOWN"
           - "RECOMMENDATION: SKIP" (If the market is choppy, sideways, near strong resistance/support, or setup is unclear, strictly choose SKIP to avoid fake signals).

        2. WRITE THE ENTIRE DETAILED ANALYSIS IN BENGALI (বাংলা ভাষা) including:
           - ট্রেন্ডের অবস্থা (Trend Direction)
           - সাপোর্ট ও রেজিস্ট্যান্স লেভেল (Support & Resistance)
           - ক্যান্ডেলস্টিক প্যাটার্ন ও প্রাইজ অ্যাকশন (Candlestick Patterns)
           - কেন UP / DOWN / SKIP সিগন্যাল দেওয়া হলো তার যৌক্তিক ও বিস্তারিত কারণ।
           - রিস্ক নোটিশ (Risk Disclaimer).`
      ],
    });

    res.json({ analysis: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'চার্ট বিশ্লেষণ করতে সমস্যা হয়েছে। API Key পরীক্ষা করুন বা আবার চেষ্টা করুন।' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
