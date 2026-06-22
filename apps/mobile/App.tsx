import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { apiFetch, clearToken, getToken, setToken } from "./lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Digest {
  todayEvents: { id: string; title: string; startsAt: string }[];
  upcomingRenewables: { id: string; name: string; daysUntil: number }[];
  shoppingItemCount: number;
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setBooting(false);
        return;
      }
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          await loadDigest();
        }
      }
      setBooting(false);
    })();
  }, []);

  async function loadDigest() {
    const res = await apiFetch("/api/digest");
    if (res.ok) {
      const data = await res.json();
      setDigest(data.digest);
    }
  }

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }
    const data = await res.json();
    await setToken(data.token);
    setUser(data.user);
    await loadDigest();
  }

  async function handleLogout() {
    await clearToken();
    setUser(null);
    setDigest(null);
  }

  if (booting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>FamilyBrain</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log in"}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Create a household from the web app first, then log in here with the same email and password.
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Good morning, {user.name.split(" ")[0]}</Text>
      <Text style={styles.section}>Today&apos;s briefing</Text>
      {digest && digest.todayEvents.length === 0 && digest.upcomingRenewables.length === 0 && digest.shoppingItemCount === 0 ? (
        <Text>Nothing urgent today.</Text>
      ) : (
        <View>
          {digest?.todayEvents.map((e) => (
            <Text key={e.id}>
              • {e.title} at {new Date(e.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </Text>
          ))}
          {digest?.upcomingRenewables.map((r) => (
            <Text key={r.id}>
              • {r.name} {r.daysUntil <= 0 ? "is due today" : `expires in ${r.daysUntil} days`}
            </Text>
          ))}
          {!!digest?.shoppingItemCount && <Text>• {digest.shoppingItemCount} items on the shopping list</Text>}
        </View>
      )}
      <Text style={styles.hint}>
        This is a read-only phase 0 view. Use the web app for the full calendar, shopping list, and renewals.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 64,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  section: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#222",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#c0392b",
  },
  hint: {
    color: "#666",
    fontSize: 13,
    marginTop: 16,
  },
});
