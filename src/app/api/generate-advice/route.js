// File: app/api/generate-advice/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the request body
    const { problem } = await request.json();
    
    if (!problem || problem.trim() === '') {
      return NextResponse.json(
        { error: 'Problem statement is required' },
        { status: 400 }
      );
    }
    
    // Import GenKit dynamically to prevent server-side issues
    const { genkit } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/googleai');
    const { gemini15Flash } = await import('@genkit-ai/googleai');
    
    // Initialize GenKit with proper error handling
    let ai;
    try {
      ai = genkit({
        plugins: [googleAI({
          apiKey: process.env.GOOGLE_AI_API_KEY || 'AIzaSyAQS9kGnjUWhSO5MCTGSC1XjMsGHHxk9BM'
        })],
        model: gemini15Flash,
      });
    } catch (initError) {
      console.error('Error initializing GenKit:', initError);
      return NextResponse.json(
        { error: 'AI service initialization failed', details: initError.message },
        { status: 500 }
      );
    }
    
    // Define the advice generation flow with better error handling
    let generateAdviceFlow;
    try {
      generateAdviceFlow = ai.defineFlow('generateAdviceFlow', async (problemText) => {
        const prompt = `Bro I am tired of prompting again and again. Listen, you have to be bakchod ekdum andha wala, but keep your advices mature, kuch bhi nahi bolna hai, keep it crisp! achhe se baat kar.But keep it savage. Also dont force comedy and humour, keep it real. Use pop and meme references. Give very crisp advices and be raw.use Hinglish in banarasi accent. Dont over use anything, I need it very normal and funny, also advice should be in 150 words max. Be savage and funny. Dont sound like forced reference talker. Dont use symbols in text like *

   Problem: ${problemText}

`;
        
        const { text } = await ai.generate(prompt);
        return text.trim();
      });
    } catch (flowError) {
      console.error('Error defining GenKit flow:', flowError);
      return NextResponse.json(
        { error: 'Failed to set up AI flow', details: flowError.message },
        { status: 500 }
      );
    }
    
    // Generate advice using GenKit with timeout
    let advice;
    try {
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timed out')), 15000)
      );
      
      const advicePromise = generateAdviceFlow(problem);
      advice = await Promise.race([advicePromise, timeoutPromise]);
      
      if (!advice) {
        throw new Error('Empty response from AI');
      }
    } catch (aiError) {
      console.error('Error in AI advice generation:', aiError);
      return NextResponse.json(
        { error: 'Failed to generate advice', details: aiError.message },
        { status: 500 }
      );
    }
    
    // Return the generated advice
    return NextResponse.json({ advice });
  } catch (error) {
    console.error('Unexpected error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}