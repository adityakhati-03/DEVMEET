import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import Friendship from '@/models/Friendship';
import User from '@/models/User';

// GET /api/friends — returns { friends, incoming, outgoing }
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const me = await User.findOne({ email: session.user.email }).lean() as any;
    if (!me) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const [accepted, incoming, outgoing] = await Promise.all([
      Friendship.find({ status: 'accepted', $or: [{ requester: me._id }, { recipient: me._id }] })
        .populate('requester', 'name username email avatar')
        .populate('recipient', 'name username email avatar')
        .lean(),
      Friendship.find({ recipient: me._id, status: 'pending' })
        .populate('requester', 'name username email avatar')
        .lean(),
      Friendship.find({ requester: me._id, status: 'pending' })
        .populate('recipient', 'name username email avatar')
        .lean(),
    ]);

    // Return the "other" user for accepted friendships
    const friends = accepted.map((f: any) => ({
      friendshipId: f._id,
      user: f.requester._id.toString() === me._id.toString() ? f.recipient : f.requester,
      since: f.updatedAt,
    }));

    return NextResponse.json({ success: true, friends, incoming, outgoing });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST /api/friends — send a friend request by email or username
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { query } = await req.json(); // email or username
    if (!query?.trim()) return NextResponse.json({ message: 'Email or username required' }, { status: 400 });

    await dbConnect();
    const me = await User.findOne({ email: session.user.email }).lean() as any;
    if (!me) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Find target user by email OR username
    const target = await User.findOne({
      $or: [{ email: query.toLowerCase() }, { username: query }],
    }).lean() as any;

    if (!target) return NextResponse.json({ message: 'User not found. Check the email or username.' }, { status: 404 });
    if (target._id.toString() === me._id.toString()) {
      return NextResponse.json({ message: 'You cannot add yourself.' }, { status: 400 });
    }

    // Check if friendship already exists (in either direction)
    const existing = await Friendship.findOne({
      $or: [
        { requester: me._id, recipient: target._id },
        { requester: target._id, recipient: me._id },
      ],
    }).lean() as any;

    if (existing) {
      if (existing.status === 'accepted') return NextResponse.json({ message: 'Already friends!' }, { status: 409 });
      if (existing.status === 'pending')  return NextResponse.json({ message: 'Request already sent.' }, { status: 409 });
    }

    const friendship = await Friendship.create({ requester: me._id, recipient: target._id });
    return NextResponse.json({ success: true, friendship }, { status: 201 });
  } catch (e: any) {
    if (e.code === 11000) return NextResponse.json({ message: 'Request already sent.' }, { status: 409 });
    console.error(e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
