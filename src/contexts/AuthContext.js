import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, ensureUserProfile } from "../services/supabase";

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