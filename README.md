# VSF Technology RAG Chatbot

A smart chatbot for VSF Technology website that uses RAG (Retrieval-Augmented Generation) to answer questions about web hosting, domains, SSL certificates, and other services.

## Features

- 🤖 **AI-Powered**: Uses Google Gemini 2.0 Flash via OpenRouter
- 🔍 **Smart Search**: Automatically finds relevant pages from your website
- 📚 **RAG System**: Fetches real content from your website to provide accurate answers
- 🛠️ **Function Calling**: Uses AI tools to search and fetch webpage content
- 💬 **Web Interface**: Beautiful chat UI for easy interaction
- 🚀 **Fast & Efficient**: Caches fetched pages for better performance

## Prerequisites

- Node.js 18+ installed
- Internet connection (to fetch webpages and call OpenRouter API)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
MODEL=google/gemini-2.0-flash-exp:free
PORT=3000
```

**Important**: Replace `your_openrouter_api_key_here` with your actual OpenRouter API key from https://openrouter.ai/keys

## Usage

### Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### Use the Web Interface

Open your browser and go to:
```
http://localhost:3000
```

You'll see a beautiful chat interface where you can ask questions like:
- "Tell me about WordPress hosting"
- "What SSL certificates do you offer?"
- "How do I transfer a domain to GoDaddy?"
- "What are your VPS hosting plans?"

### CLI Mode (for testing)

```bash
node index.js --cli
```

Then type your questions directly in the terminal.

## How It Works

1. **User asks a question** → The chatbot receives your query
2. **AI searches sitemap** → Uses `search_website_urls` tool to find relevant pages
3. **Fetches content** → Uses `fetch_webpage_content` tool to get actual page content
4. **Generates answer** → AI processes the content and provides an accurate answer

## API Endpoints

### POST `/api/chat`
Send a message to the chatbot
```json
{
  "message": "What is WordPress hosting?"
}
```

Response:
```json
{
  "response": "WordPress hosting is..."
}
```

### POST `/api/reset`
Reset the conversation history

### GET `/api/urls`
Get all URLs from the sitemap

## Project Structure

```
├── index.js              # Main server file
├── chatbot.js            # RAG chatbot implementation
├── sitemapParser.js      # Sitemap parsing and URL search
├── webScraper.js         # Web scraping and content extraction
├── public/
│   └── index.html        # Web chat interface
├── www.vsf.technology/   # Sitemap files
├── package.json
├── .env                  # Environment variables
└── README.md
```

## Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `MODEL`: AI model to use (google/gemini-2.0-flash-exp)
- `PORT`: Server port (default: 3000)

## Features in Detail

### Smart URL Search
The chatbot intelligently searches through your sitemap based on:
- Exact phrase matches
- Keyword relevance
- Category matching (pages, blog posts, products)

### Web Scraping
- Extracts main content from pages
- Removes navigation, footer, and ads
- Caches fetched content for performance

### RAG System
- Retrieves relevant information from actual web pages
- Augments AI responses with real, up-to-date content
- Provides accurate, contextual answers

## Development

### Watch Mode (auto-restart on changes)
```bash
npm run dev
```

## Troubleshooting

**Issue**: Chatbot stuck or hanging
- ✅ **Fixed**: Added 60-second timeout with retry logic
- ✅ **Fixed**: Added exponential backoff for failed requests
- The chatbot will automatically retry up to 3 times

**Issue**: Chatbot doesn't fetch pages
- Check your internet connection
- Verify the website URLs are accessible
- Check server logs for specific errors

**Issue**: API errors
- Verify your OpenRouter API key is correct in `.env` file
- Check if you have API credits at https://openrouter.ai/
- Make sure you're using a valid model name

**Issue**: Slow responses
- The first request to a page is slower (fetching and processing)
- Subsequent requests use cache and are faster
- Large queries may take 10-30 seconds

## License

ISC

## Support

For issues or questions, contact VSF Technology support.

