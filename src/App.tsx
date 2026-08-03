import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.tsx';
import LiveChat from './components/LiveChat.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';

const getInitialView = (): 'home' | 'chat' | 'admin' => {
  if (typeof window === 'undefined') return 'home';
  try {
    const params = new URLSearchParams(window.location.search);
    const rawPath = window.location.pathname;
    const path = rawPath.replace(/\/$/, '') || '/';

    if (path === '/london-site/admin') {
      return 'admin';
    } else if (path === '/chat' || path === '/support' || path === '/live-chat' || params.get('chat') === 'true' || params.get('channel')) {
      return 'chat';
    }
  } catch (error) {
    console.warn('Failed to parse URL on load:', error);
  }
  return 'home';
};

export default function App() {
  const [view, setView] = useState<'home' | 'chat' | 'admin'>(getInitialView);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [visualHeight, setVisualHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      const vv = window.visualViewport;
      const height = vv ? vv.height : window.innerHeight;
      setVisualHeight(height);
      document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
    };

    updateHeight();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateHeight);
      vv.addEventListener('scroll', updateHeight);
    } else {
      window.addEventListener('resize', updateHeight);
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateHeight);
        vv.removeEventListener('scroll', updateHeight);
      } else {
        window.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const rawPath = window.location.pathname;
        const path = rawPath.replace(/\/$/, '') || '/';

        if (path === '/london-site/admin') {
          setView('admin');
        } else if (path === '/chat' || path === '/support' || path === '/live-chat' || params.get('chat') === 'true' || params.get('channel')) {
          setView('chat');
          const channel = params.get('channel');
          if (channel) {
            setSessionId(channel);
          }
        } else {
          setView('home');
        }
      } catch (error) {
        console.warn('Failed to parse URL on load:', error);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const navigateTo = (newView: 'home' | 'chat' | 'admin') => {
    setView(newView);
    try {
      const url = new URL(window.location.href);
      
      // Reset search params and path
      url.searchParams.delete('chat');
      url.searchParams.delete('admin');
      url.searchParams.delete('channel');

      if (newView === 'chat') {
        url.pathname = '/chat';
      } else if (newView === 'admin') {
        url.pathname = '/london-site/admin';
      } else {
        url.pathname = '/';
      }

      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.warn('window.history.pushState failed or blocked inside iframe:', error);
    }
  };

  const isScrollLockedView = view === 'chat';

  return (
    <div 
      className={`w-full ${isScrollLockedView ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-slate-50 text-slate-900 font-sans antialiased relative`}
    >
      {isScrollLockedView && (
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            overscroll-behavior: none;
          }
        ` }} />
      )}
      {view === 'home' && (
        <LandingPage onOpenChat={() => navigateTo('chat')} />
      )}
      {view === 'chat' && (
        <LiveChat onBackToHome={() => navigateTo('home')} sessionId={sessionId} />
      )}
      {view === 'admin' && (
        <AdminDashboard onBackToHome={() => navigateTo('home')} />
      )}
    </div>
  );
}

