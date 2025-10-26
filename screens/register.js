import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Alert,
  Image,
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
// IMPORTANT: Update your config.js to use your desktop IP address, e.g., 
// export const API_URL = 'http://192.168.1.10:5135/Auth'; // Note: /Auth is the Controller Route
import { API_URL } from "../config"; // Example: http://192.168.1.10:5135/Auth 

import facebook from "../assets/images/facebook.png";
import google from "../assets/images/google.png";

const addresses = {
  "Rodriguez Rizal": ["San Jose", "Geronimo", "Balite", "Burgos", "Macabud", "Manggahan", "Mascap", "San Rafael", "San Isidro"],
  "Quezon City": ["Tandang Sora", "Batasan Hills", "Commonwealth", "Holy Spirit", "Kaligayahan", "Kamuning", "Loyola Heights", "Old Balara", "Pasong Tamo", "Project 6", "Quirino 3-A", "San Bartolome", "San Isidro", "Santa Lucia", "Talayan", "Bagong Pagasa"],
  Manila: ["Binondo", "Ermita", "Malate"],
  Makati: ["Poblacion", "Bel-Air", "San Antonio"],
};

export default function Register() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    // Basic Client-Side Validation
    if (!name || !email || !password || !confirmPassword || !selectedCity || !selectedBarangay) {
      setError("All fields are required");
      return;
    }
    // Removed overly restrictive @gmail.com check, keeping general email validation
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    try {
      // FIX: Corrected template literal syntax (using backticks)
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          city: selectedCity,
          barangay: selectedBarangay,
        }),
      });

      const data = await response.json();

      // FIX: Rely on HTTP status (response.ok) for success check
      if (response.ok) {
        Alert.alert("Success", data.message || "Signup successful! Please log in.");
        navigation.navigate("Login");
      } else {
        // Use the message returned from the C# backend on failure (e.g., 409 Conflict)
        setError(data.message || `Signup failed with status: ${response.status}`);
      }
    } catch (err) {
      console.error("Signup Error:", err);
      // Inform the user about the likely cause in a React Native environment
      setError(
        "Failed to connect to server. Check your device/emulator network and ensure API_URL uses your desktop IP address."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#ffe5e5" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity style={styles.circle} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Register</Text>
          </View>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* City Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedCity}
                onValueChange={(value) => {
                  setSelectedCity(value);
                  setSelectedBarangay("");
                }}
                mode="dropdown"
                style={{ height: 50, width: "100%" }}
              >
                <Picker.Item label="Select City" value="" />
                {Object.keys(addresses).map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>

            {/* Barangay Picker */}
            {selectedCity !== "" && (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedBarangay}
                  onValueChange={(value) => setSelectedBarangay(value)}
                  mode="dropdown"
                  style={{ height: 50, width: "100%" }}
                >
                  <Picker.Item label="Select Barangay" value="" />
                  {addresses[selectedCity].map((barangay) => (
                    <Picker.Item key={barangay} label={barangay} value={barangay} />
                  ))}
                </Picker>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
              <Text style={styles.signupText}>Signup</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>Or Continue with</Text>
              <View style={styles.line} />
            </View>
            <View style={styles.socialContainer}>
              <Image source={google} style={styles.socialIcon} />
              <Image source={facebook} style={styles.socialIcon} />
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 20 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#000", justifyContent: "center", alignItems: "center", marginRight: 10 },
  backArrow: { fontSize: 22, color: "#fff", fontWeight: "bold", lineHeight: 36, textAlign: "center" },
  title: { fontSize: 22, fontWeight: "600" },
  form: { width: "100%", alignItems: "center" },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 20, padding: 12, marginVertical: 8, backgroundColor: "#fff" },
  pickerWrapper: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 20, marginVertical: 8, backgroundColor: "#fff", justifyContent: 'center' },
  signupBtn: { backgroundColor: "red", paddingVertical: 12, borderRadius: 20, marginTop: 10, width: "100%" },
  signupText: { color: "#fff", fontWeight: "bold", fontSize: 16, textAlign: "center" },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 20, width: "100%" },
  line: { flex: 1, height: 1, backgroundColor: "black" },
  orText: { marginHorizontal: 10, fontSize: 14 },
  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 20 },
  socialIcon: { width: 40, height: 40, marginHorizontal: 10 },
  errorText: { color: "red", fontSize: 12, alignSelf: "flex-start", marginBottom: 5, marginLeft: 5 },
});