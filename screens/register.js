import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Alert,
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ENDPOINTS } from "../config";

export default function Register() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation
  const [scaleAnim] = useState(new Animated.Value(1));
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  // Password strength checker (at least 6 chars, letters + numbers)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError("Password must be at least 6 characters and include letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");

    try {
      const response = await fetch(`${ENDPOINTS.AUTH}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", data.message || "Registration successful!");
        navigation.navigate("Login");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError("Failed to connect to server. Please check your internet connection.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=1200",
          }}
          style={styles.background}
          blurRadius={5}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
              <Text style={styles.header}>Create an Account 🍴</Text>
              <Text style={styles.subHeader}>
                Join and start ordering delicious meals!
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#aaa"
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                placeholderTextColor="#aaa"
              />

              {/* Password box with lock icon (forces remount with key to avoid Android invisible text bug) */}
              <View style={styles.passwordBox}>
                <TextInput
                  // key forces remount when showPassword toggles so Android renders correctly in prod builds
                  key={`pwd-${showPassword ? "v" : "h"}`}
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  textContentType="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.iconBtn}
                  accessibilityLabel="Toggle password visibility"
                >
                  <Ionicons
                    name={showPassword ? "lock-open" : "lock-closed"}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.hintText}>
                Password must be ≥6 chars and include letters + numbers
              </Text>

              {/* Confirm password */}
              <View style={styles.passwordBox}>
                <TextInput
                  key={`conf-${showConfirmPassword ? "v" : "h"}`}
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  textContentType="password"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.iconBtn}
                  accessibilityLabel="Toggle confirm password visibility"
                >
                  <Ionicons
                    name={showConfirmPassword ? "lock-open" : "lock-closed"}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSignup}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.linkText}>Already have an account? Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff4d4d",
    textAlign: "center",
  },
  subHeader: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 18,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    fontSize: 15,
    color: "#333",
  },
  passwordBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    marginVertical: 8,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Platform.OS === "android" ? 12 : 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#333",
  },
  iconBtn: {
    padding: 8,
  },
  hintText: {
    color: "#666",
    fontSize: 12,
    marginTop: -4,
    marginBottom: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#ff4d4d",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    shadowColor: "#ff4d4d",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: 5,
    marginBottom: 5,
    textAlign: "center",
  },
  linkText: {
    color: "#ff4d4d",
    marginTop: 20,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
