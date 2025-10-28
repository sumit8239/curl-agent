import fs from 'fs';
import path from 'path';

/**
 * Parse sitemap files and extract URLs with metadata
 */
export class SitemapParser {
    constructor(sitemapDir) {
        this.sitemapDir = sitemapDir;
        this.urls = [];
    }

    /**
     * Load and parse all sitemap files
     */
    async loadSitemaps() {
        const files = [
            'page-sitemap.xml',
            'post-sitemap.xml',
            'reseller_product-sitemap.xml'
        ];

        for (const file of files) {
            const filePath = path.join(this.sitemapDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const urls = this.parseSitemapContent(content, file);
                this.urls.push(...urls);
            } catch (error) {
                console.error(`Error reading ${file}:`, error.message);
            }
        }

        console.log(`Loaded ${this.urls.length} URLs from sitemaps`);
        return this.urls;
    }

    /**
     * Parse sitemap content and extract URLs
     */
    parseSitemapContent(content, filename) {
        const urls = [];
        const lines = content.split('\n');

        let category = 'general';
        if (filename.includes('page')) category = 'page';
        else if (filename.includes('post')) category = 'blog';
        else if (filename.includes('product')) category = 'product';

        for (const line of lines) {
            if (line.startsWith('https://')) {
                const url = line.split('\t')[0].trim();
                const urlPath = url.replace('https://www.vsf.technology/', '');

                // Extract keywords from URL path
                const keywords = urlPath
                    .replace(/\//g, ' ')
                    .replace(/-/g, ' ')
                    .toLowerCase()
                    .trim();

                urls.push({
                    url,
                    path: urlPath,
                    category,
                    keywords,
                    title: this.generateTitle(urlPath)
                });
            }
        }

        return urls;
    }

    /**
     * Generate a readable title from URL path
     */
    generateTitle(urlPath) {
        return urlPath
            .replace(/\//g, '')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') || 'Home';
    }

    /**
     * Search for relevant URLs based on query
     */
    searchUrls(query, limit = 5) {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ').filter(w => w.length > 2);

        const scored = this.urls.map(urlData => {
            let score = 0;

            // Exact phrase match in keywords
            if (urlData.keywords.includes(queryLower)) {
                score += 100;
            }

            // Word matches in keywords
            queryWords.forEach(word => {
                if (urlData.keywords.includes(word)) {
                    score += 10;
                }
            });

            // Category bonuses
            if (queryLower.includes('product') || queryLower.includes('pricing') || queryLower.includes('buy')) {
                if (urlData.category === 'product') score += 20;
            }
            if (queryLower.includes('blog') || queryLower.includes('article') || queryLower.includes('how to')) {
                if (urlData.category === 'blog') score += 20;
            }

            return { ...urlData, score };
        });

        return scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Get all URLs
     */
    getAllUrls() {
        return this.urls;
    }
}

