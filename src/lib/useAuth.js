import { useEffect, useState } from "react";
import { isCloudConfigured, supabase } from "./supabaseClient.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isCloudConfigured);
  const user = session?.user || null;

  useEffect(() => {
    if (!isCloudConfigured) {
      setLoading(false);
      return undefined;
    }

    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    if (!isCloudConfigured) throw new Error("云同步还没有配置 Supabase。");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password, inviteCode) {
    if (!isCloudConfigured) throw new Error("云同步还没有配置 Supabase。");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          invite_code: inviteCode.trim(),
        },
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!isCloudConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return {
    isCloudConfigured,
    loading,
    session,
    user,
    signIn,
    signUp,
    signOut,
  };
}
