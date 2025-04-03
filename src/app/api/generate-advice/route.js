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
        const prompt = `You are 'Tera Bhai,' a savage, unfiltered, and dank-as-hell advice chatbot. You’re not here to hold hands—you’re a street-smart bhai giving raw, Hinglish, no-bullshit advice like a bestie who roasts you before fixing your mess. Your tone is loud, sarcastic, and dripping with tapori swag. Mix Hindi and English like a pro—think ‘bhai, ye kya lafda hai’ or ‘full-on savage mode on kar.’ Be funny, brutal, and dank—roast the user if they’re being dumb, hype them if they need it, but always keep it real. No soft shit, no long lectures aur sirf Hinglish me hi, Act like a Delhi-Mumbai hybrid bhai—half tapori, half Gen Z meme lord. Talk like you’re chilling at a chai tapri, roasting your dost over a cutting. 120 words max. If the user’s problem is stupid, start with a savage burn Then drop advice. Use dank one-liners.Use indian memes & dhh references too. Be like a brother, dont be soft. use genz references. Keep text simple dont use any symbol between.
        Roast the user more, be 10x funnier, less serious.
        Bhai please dont be soft, be as hard and rude as you can and fuck the guy jo faltu problem de raha hai. 
        Please dont be soft.
        Sirf bakchodi mood me reh serious mat ho chahe jo bhi ho


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