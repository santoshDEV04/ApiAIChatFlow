import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export async function POST(request) {
    try {
        const { message } = await request.json();

        const completion = await openai.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: 'user', content: message }]
        });

        return new Response(JSON.stringify({
            response: completion.choices[0].message.content,
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Groq API error:", error);
        return new Response(JSON.stringify({
            error: "Failed to process request."
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
