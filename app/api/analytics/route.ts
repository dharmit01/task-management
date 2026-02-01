import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, timestamp, type, userAgent } = body;
    
    // Log to console
    console.log(`[ANALYTICS] ${timestamp} - ${type} - ${url}`);
    
    // Optional: Store in database
    // await Analytics.create({ url, timestamp, type, userAgent });
    
    // Optional: Send to external analytics service
    // await fetch('https://your-analytics-service.com/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ url, timestamp, type })
    // });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
