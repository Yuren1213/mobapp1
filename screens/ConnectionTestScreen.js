import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Button } from "react-native";
import axios from "axios";
import { ENDPOINTS } from "../config"; // adjust path if needed

export default function ConnectionTestScreen() {
  const [status, setStatus] = useState("Checking...");
  const [loading, setLoading] = useState(true);

  const testConnection = async () => {
    setLoading(true);
    try {
      const res = await axios.get(ENDPOINTS.TEST);
      setStatus(`✅ Connected: ${res.data}`);
    } catch (error) {
      console.log("Error:", error.message);
      setStatus("❌ Failed to connect. Check ngrok or network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      {loading ? <ActivityIndicator size="large" color="#007BFF" /> : <Text style={styles.status}>{status}</Text>}
      <Button title="Retest Connection" onPress={testConnection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 20 },
  status: { marginTop: 15, fontSize: 16, color: "#333" },
});
