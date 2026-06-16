import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { IDiscussion, IEvent, IUser, IFriendship } from '@devmeet/shared';
import { MessageSquare, Calendar, Users, PlusCircle, Search, UserPlus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../components/ui/LoadingSpinner';

import { useSearchParams } from 'react-router-dom';

export default function CommunityPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = (searchParams.get('tab') as any) || 'discussions';
  const [activeTab, setActiveTab] = useState<'discussions' | 'events' | 'members' | 'friends'>(defaultTab);

  const [discussions, setDiscussions] = useState<IDiscussion[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [members, setMembers] = useState<IUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<IFriendship[]>([]);
  const [friends, setFriends] = useState<IFriendship[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(true);

  const fetchDiscussions = () => api.get('/api/community/discussions').then(r => setDiscussions(r.data.data.discussions));
  const fetchEvents = () => api.get('/api/community/events').then(r => setEvents(r.data.data.events));
  const fetchMembers = () => api.get('/api/community/members').then(r => setMembers(r.data.data.members));
  const fetchFriends = () => api.get('/api/friends').then(r => {
    setFriends(r.data.data.friends);
    setFriendRequests(r.data.data.pendingRequests);
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDiscussions(), fetchEvents(), fetchMembers(), fetchFriends()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/community/discussions', { title: newDiscussionTitle, content: newDiscussionContent });
      toast.success('Discussion created!');
      setNewDiscussionTitle('');
      setNewDiscussionContent('');
      fetchDiscussions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create discussion');
    }
  };

  const handleSendFriendRequest = async (recipientId: string) => {
    try {
      await api.post('/api/friends/request', { recipientId });
      toast.success('Friend request sent!');
      fetchFriends();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send request');
    }
  };

  const handleRespondRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      await api.patch(`/api/friends/respond/${requestId}`, { status });
      toast.success(`Request ${status}`);
      fetchFriends();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${status} request`);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
        background: activeTab === id ? 'var(--dm-surface)' : 'transparent',
        border: 'none', borderBottom: activeTab === id ? '2px solid #34d399' : '2px solid transparent',
        color: activeTab === id ? 'white' : '#94a3b8',
        fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f14', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Community</h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Connect with developers, join events, and build together.</p>

        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', marginBottom: '32px' }}>
          <TabButton id="discussions" label="Discussions" icon={MessageSquare} />
          <TabButton id="events" label="Events" icon={Calendar} />
          <TabButton id="members" label="Members" icon={Search} />
          <TabButton id="friends" label="Friends" icon={Users} />
        </div>

        {loading ? (
          <LoadingSpinner message="Loading community data..." />
        ) : (
          <div>
            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {discussions.map(d => (
                    <div key={d._id} style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: '0 0 8px 0' }}>{d.title}</h3>
                      <p style={{ color: '#94a3b8', margin: '0 0 16px 0', fontSize: '14px', lineHeight: 1.5 }}>{d.content}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                        <span>By {(d.author as IUser)?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{d.replies} replies</span>
                      </div>
                    </div>
                  ))}
                  {discussions.length === 0 && <p style={{ color: '#64748b' }}>No discussions yet. Start one!</p>}
                </div>
                
                <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', height: 'fit-content' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: '0 0 16px 0' }}>New Discussion</h3>
                  <form onSubmit={handleCreateDiscussion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input 
                      type="text" placeholder="Topic title..." value={newDiscussionTitle} onChange={e => setNewDiscussionTitle(e.target.value)} required
                      style={{ padding: '10px 14px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}
                    />
                    <textarea 
                      placeholder="What's on your mind?" value={newDiscussionContent} onChange={e => setNewDiscussionContent(e.target.value)} required rows={4}
                      style={{ padding: '10px 14px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', resize: 'vertical' }}
                    />
                    <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#34d399', color: '#0f172a', padding: '10px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                      <PlusCircle size={16} /> Post
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {events.map(e => (
                  <div key={e._id} style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>{e.title}</h3>
                      <span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{e.category}</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', minHeight: '40px' }}>{e.description}</p>
                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> {e.date} at {e.time}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={14} /> {e.attendees?.length || 0} attending</div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p style={{ color: '#64748b' }}>No upcoming events.</p>}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {members.map(m => (
                  <div key={m._id} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <img src={m.avatar || `https://ui-avatars.com/api/?name=${m.name}&background=0f172a&color=34d399`} alt={m.name} style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0' }}>{m.name}</h4>
                      <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>@{m.username}</p>
                    </div>
                    {m._id !== user?.id && (
                      <button onClick={() => handleSendFriendRequest(m._id)} style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserPlus size={14} /> Add Friend
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <h3 style={{ fontSize: '18px', color: 'white', margin: '0 0 16px 0' }}>Find Friends</h3>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                    <input 
                      type="text" 
                      placeholder="Search by name or @username..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}
                    />
                  </div>
                  {isSearching && <p style={{ color: '#64748b', fontSize: '13px', marginTop: '12px' }}>Searching...</p>}
                  {searchResults.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {searchResults.map(u => (
                        <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=1e293b&color=34d399`} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                            <div>
                              <h4 style={{ color: 'white', fontSize: '14px', margin: '0 0 2px 0' }}>{u.name}</h4>
                              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>@{u.username}</p>
                            </div>
                          </div>
                          <button onClick={() => handleSendFriendRequest(u._id)} style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserPlus size={14} /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '13px', marginTop: '12px' }}>No users found.</p>
                  )}
                </div>

                {friendRequests.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '16px' }}>Pending Requests ({friendRequests.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {friendRequests.map(req => {
                        const requester = req.requester as IUser;
                        return (
                          <div key={req._id} style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={requester.avatar || `https://ui-avatars.com/api/?name=${requester.name}&background=0f172a&color=34d399`} alt={requester.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                              <div>
                                <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '15px' }}>{requester.name}</h4>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>@{requester.username}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleRespondRequest(req._id, 'accepted')} style={{ background: '#34d399', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}><Check size={14} /> Accept</button>
                              <button onClick={() => handleRespondRequest(req._id, 'declined')} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}><X size={14} /> Decline</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '16px' }}>My Friends ({friends.length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {friends.map(f => {
                      const friend = (f.requester as IUser)._id === user?.id ? f.recipient as IUser : f.requester as IUser;
                      return (
                        <div key={f._id} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}&background=0f172a&color=34d399`} alt={friend.name} style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                          <div style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0' }}>{friend.name}</h4>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>@{friend.username}</p>
                          </div>
                        </div>
                      );
                    })}
                    {friends.length === 0 && <p style={{ color: '#64748b' }}>You haven't added any friends yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
