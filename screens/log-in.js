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
import { API_URL } from "../config"; // Make sure this points to your ngrok URL

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Login function
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, { // ← use backticks
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.user && data.token) {
        // Save user & token in AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("token", data.token);

        Alert.alert("Success", "Login successful!");
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Could not connect to the server");
      console.log(err);
    }
  };

  // Continue as guest
  const continueAsGuest = async () => {
    await AsyncStorage.setItem(
      "user",
      JSON.stringify({ _id: null, name: "Guest" })
    );
    await AsyncStorage.removeItem("token");
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff4f4" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Image
              source={require("../assets/images/cantinalogo.jpg")}
              style={styles.logo}
            />

            <Text style={styles.title}>Welcome Back 👋</Text>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
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

              <View style={styles.errorContainer}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>

              <Text style={styles.signupText}>
                Don’t have an account?{" "}
                <Text
                  style={styles.signupLink}
                  onPress={() => navigation.navigate("Register")}
                >
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
  title: { fontSize: 26, fontWeight: "bold", color: "#ff3b3b", marginBottom: 25 },
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
  },
  errorContainer: { minHeight: 25, width: "100%" },
  errorText: { color: "#ff4d4d", fontSize: 14 },
  loginBtn: {
    width: "100%",
    backgroundColor: "#ff3b3b",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
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
    alignItems: "center",
  },
  guestText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});