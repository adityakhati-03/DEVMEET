import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    let query: Record<string, any> = {};
    if (category) {
      query.category = category;
    }
    let eventsQuery = Event.find(query)
      .sort({ date: 1, time: 1 })
      .select('title description date time location attendees maxAttendees category tags createdBy');
    if (limit) {
      eventsQuery = eventsQuery.limit(Number(limit));
    }
    const events = await eventsQuery.populate('createdBy', 'name avatar');

    return NextResponse.json({
      success: true,
      data: events,
      total: await Event.countDocuments(query)
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const token = await getToken({ req: request });
    if (!token || !token._id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { title, description, date, time, location, maxAttendees, category, tags } = body;
    if (!title || !description || !date || !time || !location || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const newEvent = await Event.create({
      title,
      description,
      date,
      time,
      location,
      maxAttendees: maxAttendees || 50,
      category,
      tags: tags || [],
      createdBy: token._id,
      attendees: [token._id],
    });
    return NextResponse.json({
      success: true,
      data: newEvent,
      message: 'Event created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
} 