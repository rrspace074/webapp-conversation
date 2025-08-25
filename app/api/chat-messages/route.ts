import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
    try {
        // WORKAROUND: Read required info from URL and body separately
        const fileId = await request.text(); // Read the fileId as plain text from the body
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        const user = searchParams.get('user');
        const conversation_id = searchParams.get('conversation_id');

        // Validate that we received all the necessary parts
        if (!query || !user || !fileId) {
            const missing = [!query && 'query', !user && 'user', !fileId && 'fileId'].filter(Boolean).join(', ');
            return NextResponse.json({ error: `Missing required fields: ${missing}` }, { status: 400 });
        }

        const difyPayload = {
            inputs: {
                // IMPORTANT: This variable name 'Pitch_Deck' must match the
                // file variable name you configured in your Dify App Studio.
                Pitch_Deck: {
                    type: 'image',
                    transfer_method: 'local_file',
                    upload_file_id: fileId, // Use the ID from the request body
                },
            },
            query: query,
            user: user,
            response_mode: 'streaming',
            conversation_id: conversation_id || '',
        };

        console.log("Sending payload to Dify chat:", JSON.stringify(difyPayload, null, 2));

        const response = await axios.post('https://api.dify.ai/v1/chat-messages', difyPayload, {
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            responseType: 'stream',
        });
        
        return new Response(response.data, {
            headers: { 'Content-Type': 'text/event-stream' },
        });

    } catch (error) {
        console.error("--- AXIOS ERROR ---");
        const errorDetails = error.response?.data || error.message || 'No response data';
        console.error("Dify API Error Response:", errorDetails);
        console.error("--- END AXIOS ERROR ---");

        return NextResponse.json(
            { error: 'Failed to communicate with Dify API.', details: errorDetails },
            { status: 502 }
        );
    }
}
