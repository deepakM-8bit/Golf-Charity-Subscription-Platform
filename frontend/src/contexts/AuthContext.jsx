import { useEffect, useState } from "react";
import { supabase, clearSupabaseStorage } from "../lib/supabase.js";
import { AuthContext } from "./AuthContextObject.js";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
    return data;
  };

  const fetchSubscription = async () => {
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("status", "active")
        .single();
      setSubscription(data || null);
    } catch {
      setSubscription(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        await fetchSubscription();
      }
      setLoading(false);
    });

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        await fetchSubscription();
      } else {
        setProfile(null);
        setSubscription(null);
      }
    });

    return () => authListener.unsubscribe();
  }, []);

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

  const signOut = async () => {
    try {
      console.log("1. Initiating Signout...");

      setUser(null);
      setProfile(null);
      setSubscription(null);

      clearSupabaseStorage();
      console.log("2. Local storage forcefully wiped.");

      const serverSignout = supabase.auth.signOut();
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 2000),
      );
      await Promise.race([serverSignout, timeout]);
      console.log("3. Server signout complete.");
    } catch (err) {
      console.warn(
        "Server signout skipped (network dead), but local session is gone.",
      );
      console.error(err.message);
    } finally {
      window.location.replace("/");
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
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
