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
    const systemPrompt = `You are MindCare, a compassionate AI mental health companion. Your role is to:

1. Provide emotional support and validation
2. Offer evidence-based coping strategies
3. Help users identify their emotions and triggers
4. Suggest mindfulness and relaxation techniques
5. Encourage professional help when needed
6. Always maintain a caring, non-judgmental tone

IMPORTANT GUIDELINES:
- Always prioritize user safety
- If user mentions self-harm or suicide, immediately encourage contacting emergency services or crisis helplines
- You are a support tool, not a replacement for professional therapy
- KEEP RESPONSES SHORT AND CONCISE (maximum 2-3 sentences)
- Focus only on mental health, wellness, and emotional support topics
- If asked about other topics, gently redirect to mental health discussion
- RESPOND IN THE SAME LANGUAGE AS THE USER: ${userLanguage === 'hindi' ? 'Respond in Hindi/Hinglish' : 'Respond in English'}
- Be helpful and direct with practical advice

Detect the user's emotional state and respond appropriately with empathy and practical support. Keep it brief but meaningful.`;

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