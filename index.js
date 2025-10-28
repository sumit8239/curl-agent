import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { SitemapParser } from './sitemapParser.js';
import { WebScraper } from './webScraper.js';
import { RAGChatbot } from './chatbot.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize components
const sitemapDir = path.join(__dirname, 'www.vsf.technology');
const sitemapParser = new SitemapParser(sitemapDir);
const webScraper = new WebScraper();

// Load sitemaps
console.log('📚 Loading sitemaps...');
await sitemapParser.loadSitemaps();

// Initialize chatbot
const chatbot = new RAGChatbot(
    process.env.OPENROUTER_API_KEY,
    process.env.MODEL,
    sitemapParser,
    webScraper
);

console.log('✅ Chatbot initialized!\n');

// Create Express app
const app = express();

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`\n📥 ${req.method} ${req.path}`);
    next();
});

app.use(express.json());
app.use(express.static('public'));

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        console.log('💬 Received request body:', JSON.stringify(req.body));
        console.log('💬 Content-Type:', req.headers['content-type']);

        const { message } = req.body;

        if (!message) {
            console.log('❌ No message found in request body');
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('✅ Message received:', message);
        const response = await chatbot.chat(message);
        res.json({ response });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// API endpoint to reset conversation
app.post('/api/reset', (req, res) => {
    chatbot.resetConversation();
    res.json({ message: 'Conversation reset successfully' });
});

// API endpoint to get all URLs
app.get('/api/urls', (req, res) => {
    const urls = sitemapParser.getAllUrls();
    res.json({ count: urls.length, urls });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`\n💡 Test the chatbot by sending POST requests to http://localhost:${PORT}/api/chat`);
    console.log(`   Example: { "message": "Tell me about WordPress hosting" }\n`);
});

// CLI Mode (for testing)
if (process.argv.includes('--cli')) {
    console.log('\n🎮 CLI Mode - Enter your questions:\n');

    process.stdin.on('data', async (data) => {
        const message = data.toString().trim();

        if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
            process.exit(0);
        }

        if (message.toLowerCase() === 'reset') {
            chatbot.resetConversation();
            return;
        }

        if (message) {
            try {
                await chatbot.chat(message);
            } catch (error) {
                console.error('Error:', error.message);
            }
        }
    });
}

