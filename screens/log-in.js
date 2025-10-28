import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../config";

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

     if (response.ok && data.user) {
  await AsyncStorage.setItem("user", JSON.stringify(data.user));
  Alert.alert("Success", "Login successful!");
  navigation.replace("Home");
} else {
  setError(data.message || "Invalid credentials");
}
    } catch (err) {
      console.error("Login Error:", err);
      setError("Failed to connect to server. Check your API URL and network.");
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
  navigation.replace("Home");

  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff4f4" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Image
              source={require("../assets/images/cantinalogo.jpg")}
              style={styles.logo}
            />

            <Text style={styles.title}>Welcome Back 👋</Text>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email or Phone Number"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View style={styles.forgotContainer}>
                <TouchableOpacity onPress={() => navigation.navigate("Forgotpassword")}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginText}>
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.signupText}>
                Don’t have an account?{" "}
                <Text style={styles.signupLink} onPress={() => navigation.navigate("Register")}>
                  Sign Up
                </Text>
              </Text>

              <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest}>
  <Text style={styles.guestText}>Continue as Guest</Text>
</TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  container: { width: "100%", alignItems: "center" },
  logo: { width: 200, height: 200, marginBottom: 10, borderRadius: 100 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ff3b3b",
    marginTop: 5,
    marginBottom: 25,
  },
  formContainer: { width: "100%", alignItems: "center" },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    fontSize: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  forgotContainer: { width: "100%", alignItems: "flex-end", marginBottom: -15 },
  forgotPasswordText: { color: "#007bff", fontSize: 13 },
  errorText: { color: "#ff4d4d", fontSize: 14, marginBottom: 10, alignSelf: "flex-start" },
  loginBtn: {
    width: "100%",
    backgroundColor: "#ff3b3b",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
    elevation: 2,
    shadowColor: "#ff3b3b",
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  loginText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  signupText: { marginTop: 15, fontSize: 15, color: "#333" },
  signupLink: { color: "#ff3b3b", fontWeight: "bold" },
  guestBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    backgroundColor: "#f8a1c4",
    elevation: 2,
  },
  guestText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
