import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Discussion from '@/models/Discussion';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    let discussionsQuery = Discussion.find({})
      .sort({ [sortBy]: -1 })
      .select('title content author replies tags createdAt lastActivity');
    if (limit) {
      discussionsQuery = discussionsQuery.limit(Number(limit));
    }
    const discussions = await discussionsQuery.populate('author', 'name avatar');

    return NextResponse.json({
      success: true,
      data: discussions,
      total: await Discussion.countDocuments({})
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discussions' },
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
    const { title, content, tags } = body;
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const newDiscussion = await Discussion.create({
      title,
      content,
      author: token._id,
      tags: tags || [],
      replies: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
    });
    return NextResponse.json({
      success: true,
      data: newDiscussion,
      message: 'Discussion created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
} 