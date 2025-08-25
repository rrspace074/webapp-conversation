import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
    try {
        // Get the data the frontend sent to this route
        const body = await request.json();
        const { query, user, conversation_id, fileId } = body; // Assume frontend sends the fileId

        if (!query || !user || !fileId) {
            return NextResponse.json({ error: 'Missing required fields: query, user, fileId' }, { status: 400 });
        }

        // =================================================================
        // STEP 2: Build the CORRECT payload for Dify's chat endpoint
        // =================================================================
        const difyPayload = {
            inputs: {
                // IMPORTANT: This variable name 'Pitch_Deck' must match the
                // file variable name you configured in your Dify App Studio.
                Pitch_Deck: {
                    type: 'image',
                    transfer_method: 'local_file',
                    upload_file_id: fileId, // Use the ID passed from the frontend
                },
            },
            query: query,
            user: user,
            response_mode: 'streaming', // Or 'blocking'
            conversation_id: conversation_id || '',
        };

        console.log("Sending payload to Dify chat:", JSON.stringify(difyPayload, null, 2));

        const response = await axios.post('https://api.dify.ai/v1/chat-messages', difyPayload, {
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            responseType: 'stream', // Keep this if you need streaming
        });
        
        // If successful, you would stream the response back to the client
        // For simplicity, this example assumes success, but you'll need to pipe the stream.
        return new Response(response.data, {
            headers: { 'Content-Type': 'text/event-stream' },
        });

    } catch (error) {
        // THIS IS THE FIX FOR THE 500 ERROR
        console.error("--- AXIOS ERROR ---");
        // This will log the specific error message from Dify, like "Invalid variable name"
        console.error("Dify API Error Response:", error.response?.data);
        console.error("--- END AXIOS ERROR ---");

        // Return a proper error response instead of crashing
        return NextResponse.json(
            { error: 'Failed to communicate with Dify API.', details: error.response?.data || 'No response data' },
            { status: 502 } // 502 is more accurate here (Bad Gateway)
        );
    }
}
