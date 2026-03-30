import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sortBy') || 'lastActive';

    let usersQuery = User.find({}, 'name avatar username bio lastActive createdAt')
      .sort({ [sortBy]: -1 });
    if (limit) {
      usersQuery = usersQuery.limit(Number(limit));
    }
    const users = await usersQuery.exec();
    return NextResponse.json({
      success: true,
      data: users,
      total: await User.countDocuments({})
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, email, role, bio, skills } = body;
    
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new member profile (in a real app, this would save to database)
    const newMember = {
      id: Date.now(), // Simple ID generation
      name,
      email,
      avatar: "/api/placeholder/40/40",
      role,
      bio: bio || "",
      contributions: 0,
      followers: 0,
      following: 0,
      badges: ["New Member"],
      skills: skills || [],
      location: body.location || "",
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newMember,
      message: 'Member profile created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create member profile' },
      { status: 500 }
    );
  }
} 