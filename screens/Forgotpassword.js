import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert("⚠️ Error", "Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Password reset email has been sent.");
        navigation.goBack();
      } else {
        Alert.alert("Failed", data.message || "Unable to send reset email.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff4f4" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image
            source={require("../assets/images/cantinalogo.jpg")}
            style={styles.logo}
          />

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don’t worry! Enter your email and we’ll send a reset link.
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your registered email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.resetBtn, loading && { opacity: 0.7 }]}
              onPress={handleResetRequest}
              disabled={loading}
            >
              <Text style={styles.resetText}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ff3b3b",
    marginTop: 5,
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    fontSize: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resetBtn: {
    width: "100%",
    backgroundColor: "#ff3b3b",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#ff3b3b",
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  resetText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  backText: {
    textAlign: "center",
    color: "#007bff",
    fontSize: 15,
    fontWeight: "500",
  },
});
