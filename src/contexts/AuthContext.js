import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, ensureUserProfile, updateUserPresence } from "../services/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data?.session?.user || null);
        
        // Ensure user profile exists if user is logged in
        if (data?.session?.user) {
          const profileResult = await ensureUserProfile();
          if (!profileResult.success) {
            console.error('Failed to ensure user profile during session check:', profileResult.error);
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        
        // Ensure user profile exists when auth state changes
        if (session?.user) {
          const profileResult = await ensureUserProfile();
          if (!profileResult.success) {
            console.error('Failed to ensure user profile during auth change:', profileResult.error);
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // --- ADD Presence Update Logic --- 
  useEffect(() => {
    if (user) {
      // Initial presence set when user logs in or context loads with a user
      console.log(`AuthProvider Mount/User change: Setting presence online for user: ${user.id}`);
      updateUserPresence(user.id, true); // Pass user.id

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log(`Tab visible, setting presence to online for user: ${user.id}`);
          updateUserPresence(user.id, true); // Pass user.id
        } else {
          console.log(`Tab hidden, setting presence to offline for user: ${user.id}`);
          updateUserPresence(user.id, false); // Pass user.id
        }
      };

      const handleBeforeUnload = () => {
        console.log(`Window unloading, attempting to set presence offline for user: ${user.id}`);
        // Note: This is best-effort and might not complete
        updateUserPresence(user.id, false); // Pass user.id
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup function
      return () => {
        console.log(`AuthProvider Cleanup: Removing listeners and setting offline for user: ${user.id}`);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        // Attempt to set offline on cleanup/logout
        updateUserPresence(user.id, false); // Pass user.id
      };
    }
  }, [user]); // Depend on user object
  // --- END Presence Update Logic ---

  // Get additional user data from the users table
  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            return;
          }

          if (data) {
            setUser(currentUser => ({
              ...currentUser,
              ...data
            }));
          }
        } catch (error) {
          console.error('Error in user profile fetch:', error);
        }
      }
    };

    getUserProfile();
  }, [user?.id]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUser = async () => {
    try {
      console.log('Refreshing user data...');
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }
      
      if (data?.user) {
        console.log('User refreshed from Supabase:', data.user);
        
        // Now also get user profile data from users table
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          } else if (profileData) {
            console.log('User profile data:', profileData);
            // Merge user auth data with profile data
            const mergedUser = {
              ...data.user,
              ...profileData
            };
            
            setUser(mergedUser);
            return mergedUser;
          }
        } catch (profileError) {
          console.error('Exception fetching user profile:', profileError);
        }
        
        // If we can't get profile data, at least update with auth data
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
    return null;
  };

  const value = {
    user,
    loading,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 