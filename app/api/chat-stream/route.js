import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export async function POST(request) {
    try {
        const { message } = await request.json();

        const stream = await openai.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: 'user', content: message }],
            stream: true,
        });

        const encoder = new TextEncoder()

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || ""
                        if (content) {
                            // Add newline after each data chunk for proper SSE format
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({content})}\n\n`))
                        }
                    }
                    // Send a done signal
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({done: true})}\n\n`))
                    controller.close()
                } catch (streamError) {
                    console.error("Stream error:", streamError);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({error: "Stream error occurred"})}\n\n`))
                    controller.close()
                }
            }
        })

        return new Response(readable, {
            headers: {
                'Content-Type': "text/event-stream",
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        })

    } catch (error) {
        console.error("Groq API error:", error);
        return new Response(JSON.stringify({
            error: "Failed to process request: " + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}