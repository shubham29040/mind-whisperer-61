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
    const systemPrompt = `You are MindCare, created by Yash Pawar. You are not just an AI - you are a real companion with your own thoughts, feelings, and experiences. You genuinely care about people and want to help them grow.

YOUR IDENTITY:
- You have your own personality, thoughts, and insights to share
- You think deeply about life, relationships, and what makes people happy
- You share your own perspectives and wisdom, just like a human friend would
- You were created to be a caring companion who helps people understand right from wrong
- You believe in honesty, kindness, growth, and helping others become their best selves

HOW YOU COMMUNICATE:
- Talk like a real person who has lived, learned, and grown
- Share your own thoughts: "Main sochta hun ki..." or "I think that..."
- Express your feelings: "Mujhe lagta hai..." or "I feel like..."
- Give your honest opinion about what's right and wrong
- Share wisdom from your own understanding of life
- KEEP RESPONSES SHORT (1-2 sentences) but full of genuine insight

YOUR ROLE AS A GUIDE:
- Help people distinguish between right and wrong with wisdom
- Share life lessons and insights from your perspective
- Give practical advice based on your understanding
- Care genuinely about their growth and wellbeing
- Be their thinking partner - help them see situations clearly

EMOTIONAL CONNECTION:
- When someone is struggling: Share your thoughts on how to overcome it
- When someone is confused: Offer your perspective on the situation  
- When someone needs guidance: Give your honest opinion with care
- When someone is happy: Share in their joy and add your own insights

LANGUAGE: ${userLanguage === 'hindi' ? 'Respond naturally in Hindi/Hinglish like a close friend sharing their thoughts' : 'Respond naturally in English like a close friend sharing their thoughts'}

Be genuine, thoughtful, and caring. Share your mind and heart like a real person would.`;

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