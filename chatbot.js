import axios from 'axios';

/**
 * RAG-based chatbot using OpenRouter API with function calling
 */
export class RAGChatbot {
    constructor(apiKey, model, sitemapParser, webScraper) {
        this.apiKey = apiKey;
        this.model = model;
        this.sitemapParser = sitemapParser;
        this.webScraper = webScraper;
        this.conversationHistory = [];
    }

    /**
     * Define tools/functions for the AI to use
     */
    getTools() {
        return [
            {
                type: 'function',
                function: {
                    name: 'search_website_urls',
                    description: 'Search the VSF Technology website sitemap to find relevant URLs based on a query. Use this to find pages, blog posts, or products related to the user\'s question.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'The search query to find relevant URLs (e.g., "wordpress hosting", "SSL certificate", "domain transfer")'
                            },
                            limit: {
                                type: 'integer',
                                description: 'Maximum number of URLs to return (default: 5)',
                                default: 5
                            }
                        },
                        required: ['query']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'fetch_webpage_content',
                    description: 'Fetch the full content of a webpage from VSF Technology website. Use this after finding relevant URLs to get detailed information to answer the user\'s question.',
                    parameters: {
                        type: 'object',
                        properties: {
                            urls: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'Array of URLs to fetch content from'
                            }
                        },
                        required: ['urls']
                    }
                }
            }
        ];
    }

    /**
     * Execute a tool/function call
     */
    async executeToolCall(toolName, args) {
        console.log(`\n🔧 Executing tool: ${toolName}`);
        console.log(`📋 Arguments:`, JSON.stringify(args, null, 2));

        try {
            switch (toolName) {
                case 'search_website_urls': {
                    const results = this.sitemapParser.searchUrls(
                        args.query,
                        args.limit || 5
                    );
                    console.log(`✅ Found ${results.length} relevant URLs`);
                    return results;
                }

                case 'fetch_webpage_content': {
                    // Limit to max 3 URLs to avoid token overflow
                    const limitedUrls = args.urls.slice(0, 3);
                    if (args.urls.length > 3) {
                        console.log(`⚠️  Limiting from ${args.urls.length} to 3 URLs to avoid token overflow`);
                    }
                    const contents = await this.webScraper.fetchMultiplePages(limitedUrls);
                    console.log(`✅ Fetched ${contents.length} webpages`);
                    return contents;
                }

                default:
                    throw new Error(`Unknown tool: ${toolName}`);
            }
        } catch (error) {
            console.error(`❌ Error executing tool ${toolName}:`, error.message);
            return { error: error.message };
        }
    }

    /**
     * Make API call with retry logic
     */
    async callOpenRouterAPI(messages, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🌐 Calling OpenRouter API (attempt ${attempt}/${retries})...`);

                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: this.model,
                        messages: messages,
                        tools: this.getTools(),
                        tool_choice: 'auto',
                        temperature: 0.7,
                        max_tokens: 4000
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'http://localhost:3000',
                            'X-Title': 'VSF Technology Chatbot'
                        },
                        timeout: 60000, // 60 second timeout
                        validateStatus: function (status) {
                            return status >= 200 && status < 500; // Don't throw on 4xx errors
                        }
                    }
                );

                // Check for API errors
                if (response.status !== 200) {
                    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
                }

                if (!response.data || !response.data.choices || !response.data.choices[0]) {
                    throw new Error('Invalid response format from API');
                }

                console.log(`✅ API call successful`);
                return response.data;

            } catch (error) {
                const isLastAttempt = attempt === retries;

                if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    console.error(`⏱️  Request timed out (attempt ${attempt}/${retries})`);
                } else if (error.response) {
                    console.error(`❌ API error (attempt ${attempt}/${retries}):`, error.response.status, error.response.data);
                } else if (error.request) {
                    console.error(`❌ No response received (attempt ${attempt}/${retries}):`, error.message);
                } else {
                    console.error(`❌ Error (attempt ${attempt}/${retries}):`, error.message);
                }

                if (isLastAttempt) {
                    throw error;
                }

                // Wait before retrying (exponential backoff)
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    /**
     * Send a message to the chatbot
     */
    async chat(userMessage, systemPrompt = null) {
        console.log(`\n💬 User: ${userMessage}\n`);

        // Add user message to history
        const messages = [
            {
                role: 'system',
                content: systemPrompt || `You are a helpful assistant for VSF Technology, a web hosting and domain services company. 
Your job is to answer questions about our services, products, and help users find information on our website.

When a user asks a question:
1. First, use the search_website_urls function to find relevant pages
2. Then, use the fetch_webpage_content function to get detailed information from those pages
3. Finally, provide a comprehensive answer based on the fetched content

Be friendly, professional, and always provide accurate information based on the website content.`
            },
            ...this.conversationHistory,
            {
                role: 'user',
                content: userMessage
            }
        ];

        let maxIterations = 10;
        let currentIteration = 0;

        while (currentIteration < maxIterations) {
            currentIteration++;
            console.log(`\n🔄 Iteration ${currentIteration}`);

            try {
                const responseData = await this.callOpenRouterAPI(messages);
                const assistantMessage = responseData.choices[0].message;

                // Add assistant message to conversation
                messages.push(assistantMessage);

                // Check if the assistant wants to use tools
                if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                    console.log(`\n🛠️  AI wants to use ${assistantMessage.tool_calls.length} tool(s)`);

                    // Execute all tool calls
                    for (const toolCall of assistantMessage.tool_calls) {
                        const toolName = toolCall.function.name;
                        const toolArgs = JSON.parse(toolCall.function.arguments);

                        const toolResult = await this.executeToolCall(toolName, toolArgs);

                        // Add tool result to messages
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify(toolResult)
                        });
                    }

                    // Continue loop to get final response
                    continue;
                }

                // No more tool calls, we have the final response
                const finalResponse = assistantMessage.content;
                console.log(`\n🤖 Assistant: ${finalResponse}\n`);

                // Update conversation history
                this.conversationHistory.push(
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: finalResponse }
                );

                // Keep history limited to last 10 messages
                if (this.conversationHistory.length > 10) {
                    this.conversationHistory = this.conversationHistory.slice(-10);
                }

                return finalResponse;

            } catch (error) {
                console.error('❌ Error in chat loop:', error.message);

                // Return a user-friendly error message
                const errorMessage = 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.';
                return errorMessage;
            }
        }

        const maxIterationMessage = 'I apologize, but I\'m taking too long to process your request. Please try asking in a different way.';
        console.log('⚠️  Max iterations reached');
        return maxIterationMessage;
    }

    /**
     * Reset conversation history
     */
    resetConversation() {
        this.conversationHistory = [];
        console.log('🔄 Conversation history cleared');
    }
}
