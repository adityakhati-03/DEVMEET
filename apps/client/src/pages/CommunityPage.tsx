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

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

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

  // Poll presence
  useEffect(() => {
    let mounted = true;
    const pollPresence = async () => {
      try {
        const res = await api.get('/api/presence');
        if (mounted) {
          const ids = res.data.data.onlineUsers.map((u: any) => u._id);
          setOnlineUserIds(new Set(ids));
        }
      } catch (err) {
        console.error('Failed to poll presence:', err);
      }
    };
    pollPresence();
    const intervalId = setInterval(pollPresence, 30000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

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
        border: 'none', 
        borderBottom: activeTab === id ? '2px solid var(--dm-accent)' : '2px solid transparent',
        color: activeTab === id ? 'var(--dm-text)' : 'var(--dm-muted)',
        fontFamily: '"JetBrains Mono", monospace',
        textTransform: 'uppercase',
        fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'var(--dm-transition)'
      }}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dm-bg)', display: 'flex', flexDirection: 'column' }}>
      <main className="page-wrapper animate-fade-in" style={{ width: '100%' }}>
        <h1 style={{ fontSize: '32px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, color: 'var(--dm-text)', marginBottom: '8px' }}>Community</h1>
        <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', marginBottom: '32px' }}>Connect with developers, join events, and build together.</p>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--dm-border)', marginBottom: '32px', overflowX: 'auto' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {discussions.map(d => (
                    <div key={d._id} className="dm-card" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '20px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'var(--dm-text)', margin: '0 0 12px 0' }}>{d.title}</h3>
                      <p style={{ color: 'var(--dm-muted)', margin: '0 0 20px 0', fontSize: '15px', lineHeight: 1.6 }}>{d.content}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace' }}>
                        <span style={{ color: 'var(--dm-text)' }}>By {(d.author as IUser)?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="dm-badge" style={{ padding: '2px 8px' }}>{d.replies} replies</span>
                      </div>
                    </div>
                  ))}
                  {discussions.length === 0 && <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace' }}>No discussions yet. Start one!</p>}
                </div>
                
                <div className="dm-card" style={{ padding: '24px', height: 'fit-content' }}>
                  <h3 style={{ fontSize: '18px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'var(--dm-text)', margin: '0 0 20px 0' }}>New Discussion</h3>
                  <form onSubmit={handleCreateDiscussion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input 
                      type="text" placeholder="Topic title..." value={newDiscussionTitle} onChange={e => setNewDiscussionTitle(e.target.value)} required
                      className="dm-input"
                    />
                    <textarea 
                      placeholder="What's on your mind?" value={newDiscussionContent} onChange={e => setNewDiscussionContent(e.target.value)} required rows={5}
                      className="dm-input" style={{ resize: 'vertical' }}
                    />
                    <button type="submit" className="dm-btn-primary" style={{ width: '100%' }}>
                      <PlusCircle size={18} /> Post
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="dm-grid-3">
                {events.map(e => (
                  <div key={e._id} className="dm-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '20px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'var(--dm-text)', margin: 0 }}>{e.title}</h3>
                      <span className="dm-badge">{e.category}</span>
                    </div>
                    <p style={{ color: 'var(--dm-muted)', fontSize: '15px', marginBottom: '24px', flex: 1 }}>{e.description}</p>
                    <div style={{ fontSize: '13px', color: 'var(--dm-text)', fontFamily: '"JetBrains Mono", monospace', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--dm-surface)', padding: '12px', borderRadius: 'var(--dm-radius-sm)', border: '1px solid var(--dm-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} color="var(--dm-accent)" /> {e.date} at {e.time}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} color="var(--dm-accent)" /> {e.attendees?.length || 0} attending</div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', gridColumn: '1 / -1' }}>No upcoming events.</p>}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="dm-grid-4">
                {members.map(m => (
                  <div key={m._id} className="dm-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '4px', background: 'var(--dm-surface)', border: '2px solid var(--dm-border)', borderRadius: '50%' }}>
                      <img src={m.avatar || `https://ui-avatars.com/api/?name=${m.name}&background=1a1a1a&color=facc15`} alt={m.name} style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ color: 'var(--dm-text)', fontFamily: '"Space Grotesk", sans-serif', fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{m.name}</h4>
                      <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', margin: 0 }}>@{m.username}</p>
                    </div>
                    {m._id !== user?.id && (
                      <button onClick={() => handleSendFriendRequest(m._id)} className="dm-btn-ghost" style={{ width: '100%', marginTop: 'auto' }}>
                        <UserPlus size={16} /> Add Friend
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <div className="dm-card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '24px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'var(--dm-text)', margin: '0 0 20px 0' }}>Find Friends</h3>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dm-muted)' }} size={20} />
                    <input 
                      type="text" 
                      placeholder="Search by name or @username..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="dm-input"
                      style={{ paddingLeft: '48px', fontSize: '16px' }}
                    />
                  </div>
                  {isSearching && <p style={{ color: 'var(--dm-accent)', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', marginTop: '16px' }}>Searching database...</p>}
                  {searchResults.length > 0 && (
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {searchResults.map(u => (
                        <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--dm-surface)', borderRadius: 'var(--dm-radius-sm)', border: '2px solid var(--dm-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=111111&color=facc15`} alt={u.name} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--dm-border)' }} />
                            <div>
                              <h4 style={{ color: 'var(--dm-text)', fontFamily: '"Space Grotesk", sans-serif', fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>{u.name}</h4>
                              <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', margin: 0 }}>@{u.username}</p>
                            </div>
                          </div>
                          <button onClick={() => handleSendFriendRequest(u._id)} className="dm-btn-ghost">
                            <UserPlus size={16} /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', marginTop: '16px' }}>No users found matching "{searchQuery}".</p>
                  )}
                </div>

                {friendRequests.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '24px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'var(--dm-text)', marginBottom: '24px' }}>Pending Requests ({friendRequests.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {friendRequests.map(req => {
                        const requester = req.requester as IUser;
                        return (
                          <div key={req._id} className="dm-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <img src={requester.avatar || `https://ui-avatars.com/api/?name=${requester.name}&background=1a1a1a&color=facc15`} alt={requester.name} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--dm-border)' }} />
                              <div>
                                <h4 style={{ color: 'var(--dm-text)', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, margin: '0 0 4px 0', fontSize: '18px' }}>{requester.name}</h4>
                                <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', fontSize: '14px', margin: 0 }}>@{requester.username}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button onClick={() => handleRespondRequest(req._id, 'accepted')} className="dm-btn-primary"><Check size={16} /> Accept</button>
                              <button onClick={() => handleRespondRequest(req._id, 'declined')} className="dm-btn-danger"><X size={16} /> Decline</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '24px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'var(--dm-text)', marginBottom: '24px' }}>My Friends ({friends.length})</h3>
                  <div className="dm-grid-4">
                    {friends.map(f => {
                      const friend = (f.requester as IUser)._id === user?.id ? f.recipient as IUser : f.requester as IUser;
                      return (
                        <div key={f._id} className="dm-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative' }}>
                          {onlineUserIds.has(friend._id) && (
                            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} /> Online
                            </div>
                          )}
                          <div style={{ padding: '4px', background: 'var(--dm-surface)', border: onlineUserIds.has(friend._id) ? '2px solid #34d399' : '2px solid var(--dm-border)', borderRadius: '50%' }}>
                            <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}&background=1a1a1a&color=facc15`} alt={friend.name} style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--dm-text)', fontFamily: '"Space Grotesk", sans-serif', fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{friend.name}</h4>
                            <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', margin: 0 }}>@{friend.username}</p>
                          </div>
                        </div>
                      );
                    })}
                    {friends.length === 0 && <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', gridColumn: '1 / -1' }}>You haven't added any friends yet. Use the search above!</p>}
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

