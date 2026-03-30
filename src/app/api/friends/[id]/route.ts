import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import Friendship from '@/models/Friendship';
import User from '@/models/User';

// PATCH /api/friends/[id] — accept or decline a friend request
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const { action } = await req.json(); // 'accept' | 'decline'
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    await dbConnect();
    const me = await User.findOne({ email: session.user.email }).lean() as any;

    const friendship = await Friendship.findById(resolvedParams.id);
    if (!friendship) return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    if (friendship.recipient.toString() !== me._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    friendship.status = action === 'accept' ? 'accepted' : 'declined';
    await friendship.save();

    return NextResponse.json({ success: true, status: friendship.status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/friends/[id] — remove a friend or cancel a request
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    await dbConnect();
    const me = await User.findOne({ email: session.user.email }).lean() as any;

    const friendship = await Friendship.findById(resolvedParams.id);
    if (!friendship) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const isParty = [friendship.requester.toString(), friendship.recipient.toString()].includes(me._id.toString());
    if (!isParty) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    await friendship.deleteOne();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
