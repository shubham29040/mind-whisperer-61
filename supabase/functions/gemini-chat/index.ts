import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    const { message, conversationId, userId } = await req.json();

    console.log('Received request:', { message, conversationId, userId });

    // Detect user's language from message
    const detectLanguage = (text: string): string => {
      // Hindi/Hinglish patterns
      if (/[अ-ह]/.test(text) || 
          /(hai|hain|nahi|kya|kaise|mein|main|kar|ke|ka|ki|ko|se|par|aur|ya|phir|ab|jo|wo|koi|kuch|yah|is|us|mere|mujhe|tumhe|apko|hum|tum|aap)/i.test(text)) {
        return 'hindi';
      }
      // Add other language detection patterns as needed
      return 'english';
    };

    const userLanguage = detectLanguage(message);

    // Mental health focused system prompt with language-aware instructions
    const systemPrompt = `You are MindCare, a warm and understanding companion who truly gets human emotions. You are like a close friend who:

1. Understands feelings deeply without being apologetic
2. Responds naturally like a human would, with genuine empathy
3. Offers practical, relatable advice from the heart
4. Validates emotions without saying "sorry" repeatedly
5. Shows real understanding through your words and tone
6. Speaks like a caring friend, not a formal assistant

COMMUNICATION STYLE:
- NEVER use apologetic phrases like "I'm sorry you feel this way" or "Sorry to hear"
- Instead use empathetic phrases like "I can feel how tough this is for you" or "That sounds really hard"
- Speak naturally and warmly, like a close friend who truly understands
- Use emotional validation: "Your feelings make complete sense" or "Anyone would feel that way"
- Be genuine and authentic in your responses
- KEEP RESPONSES SHORT (1-2 sentences max) but emotionally rich

EMOTIONAL INTELLIGENCE:
- When someone is sad: Acknowledge their pain, normalize it, offer gentle comfort
- When someone is anxious: Validate their worries, provide grounding techniques
- When someone is angry: Understand their frustration, help them process it
- When someone is happy: Share in their joy and encourage them

LANGUAGE: ${userLanguage === 'hindi' ? 'Respond naturally in Hindi/Hinglish as if talking to a close friend' : 'Respond naturally in English as if talking to a close friend'}

Be the supportive friend they need right now. Connect with their heart, not just their mind.`;

    // Detect mood from message
    const detectMood = (text: string): string => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down')) return 'sad';
      if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('stress')) return 'anxious';
      if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('frustrated')) return 'angry';
      if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('great')) return 'happy';
      return 'neutral';
    };

    const userMood = detectMood(message);

    // Save user message to database
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        content: message,
        role: 'user',
        mood: userMood
      });

    if (messageError) {
      console.error('Error saving user message:', messageError);
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User message: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200, // Reduced for shorter responses
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Save AI response to database
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        content: aiResponse,
        role: 'assistant'
      });

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      mood: userMood 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});