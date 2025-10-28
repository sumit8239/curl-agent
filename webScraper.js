import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Web scraper to fetch and extract content from web pages
 */
export class WebScraper {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Fetch and extract text content from a URL
     */
    async fetchPageContent(url) {
        // Check cache first
        if (this.cache.has(url)) {
            console.log(`Cache hit for: ${url}`);
            return this.cache.get(url);
        }

        try {
            console.log(`Fetching: ${url}`);
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);

            // Remove unwanted elements
            $('script, style, nav, footer, header, aside, .cookie-notice, .advertisement').remove();

            // Extract main content
            let content = '';

            // Try to find main content area
            const mainSelectors = [
                'main',
                'article',
                '.entry-content',
                '.post-content',
                '.content',
                '#content',
                '.main-content'
            ];

            for (const selector of mainSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    content = element.text();
                    break;
                }
            }

            // Fallback to body if no main content found
            if (!content) {
                content = $('body').text();
            }

            // Clean up the text
            content = content
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, '\n')
                .trim();

            // Extract title
            const title = $('title').text() || $('h1').first().text() || '';

            // Extract meta description
            const description = $('meta[name="description"]').attr('content') || '';

            const result = {
                url,
                title: title.trim(),
                description: description.trim(),
                content: content.substring(0, 3000), // Limit content to 3000 chars to avoid token overflow
                fetchedAt: new Date().toISOString()
            };

            // Cache the result
            this.cache.set(url, result);

            return result;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error.message);
            throw new Error(`Failed to fetch content from ${url}: ${error.message}`);
        }
    }

    /**
     * Fetch multiple URLs concurrently
     */
    async fetchMultiplePages(urls, maxConcurrent = 3) {
        const results = [];

        for (let i = 0; i < urls.length; i += maxConcurrent) {
            const batch = urls.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(url =>
                this.fetchPageContent(url).catch(err => ({
                    url,
                    error: err.message
                }))
            );

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

