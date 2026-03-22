import { useEffect, useState } from "react";
import { supabase, clearSupabaseStorage } from "../lib/supabase.js";
import { AuthContext } from "./AuthContextObject.js";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true); // This causes the spinner

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
    return data;
  };

  const fetchSubscription = async (userId) => {
    try {
      // This prevents PostgREST from throwing a 500 error if there's any duplicate test rows.
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Supabase query error:", error.message);
        throw error;
      }

      // Manually extract the first item from the array
      setSubscription(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error("Subscription fetch completely failed:", err);
      setSubscription(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        // Timeout Shield. If Supabase hangs, we force it to stop loading after 3 seconds.
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3000),
        );
        const {
          data: { session },
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (mounted) {
          setUser(session?.user || null);
          if (session?.user) {
            await Promise.allSettled([
              fetchProfile(session.user.id),
              fetchSubscription(session.user.id),
            ]);
          }
        }
      } catch (e) {
        console.warn("Auth initialization bypassed:", e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSubscription(session.user.id);
      } else {
        setProfile(null);
        setSubscription(null);
      }
    });

    return () => {
      mounted = false;
      authListener.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setUser(null);
      setProfile(null);
      setSubscription(null);
      clearSupabaseStorage();

      const serverSignout = supabase.auth.signOut();
      const timeout = new Promise((_, r) => setTimeout(r, 2000));
      await Promise.race([serverSignout, timeout]);
    } catch (e) {
      console.error(e);
    } finally {
      window.location.replace("/");
    }
  };

  const refreshSubscription = async () => {
    if (user) await fetchSubscription(user.id);
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const isAdmin = profile?.role === "admin";
  const isSubscribed = !!subscription;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        loading,
        isAdmin,
        isSubscribed,
        signUp,
        signIn,
        signOut,
        refreshSubscription,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
