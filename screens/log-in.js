import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  ActivityIndicator,
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
        Alert.alert("Welcome!", "Login successful 🍽️");
        navigation.replace("Home");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Unable to connect. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    navigation.replace("Home");
  };

  return (
    <View style={styles.background}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Image
            source={require("../assets/images/cantinalogo.jpg")}
            style={styles.logo}
          />

          <Text style={styles.title}>Welcome Back 👋</Text>
          <Text style={styles.subtitle}>Log in to continue your cravings</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() => navigation.navigate("Forgotpassword")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
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
              <Text style={styles.guestText}>Continue as Guest 🍽️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#fff5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 25,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: "center",
    shadowColor: "#ff6b6b",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ff6b6b",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ff3b3b",
    marginBottom: 6,
  },
  subtitle: {
    color: "#555",
    marginBottom: 25,
    fontSize: 14,
  },
  form: {
    width: "100%",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: 14,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  button: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 5,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  forgotContainer: {
    marginTop: 12,
    alignSelf: "flex-end",
  },
  forgotText: {
    color: "#ff6b6b",
    fontSize: 13,
  },
  signupText: {
    marginTop: 25,
    fontSize: 15,
    color: "#333",
    textAlign: "center",
  },
  signupLink: {
    color: "#ff3b3b",
    fontWeight: "bold",
  },
  guestBtn: {
    marginTop: 25,
    backgroundColor: "#f97377ff",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    elevation: 2,
  },
  guestText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
