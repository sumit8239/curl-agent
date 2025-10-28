import axios from 'axios';

const API_URL = 'http://localhost:3000/api/chat';

async function testChatbot() {
    console.log('🧪 Testing VSF Technology Chatbot\n');
    console.log('='.repeat(60));

    const testQuestions = [
        'Tell me about WordPress hosting',
        'What SSL certificates do you offer?',
        'How do I transfer a domain from GoDaddy?',
        'What are your VPS hosting plans?'
    ];

    for (const question of testQuestions) {
        console.log(`\n📝 Question: ${question}`);
        console.log('-'.repeat(60));

        try {
            const response = await axios.post(API_URL, {
                message: question
            });

            console.log(`\n✅ Answer:\n${response.data.response}\n`);
            console.log('='.repeat(60));

            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`\n❌ Error:`, error.message);
            if (error.response) {
                console.error('Response:', error.response.data);
            }
        }
    }

    console.log('\n✨ Test completed!\n');
}

// Run the test
testChatbot().catch(console.error);

