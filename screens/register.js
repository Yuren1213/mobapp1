import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

// ⚙️ Replace with your working backend URL:
const API_URL = "https://untooled-rostrally-trent.ngrok-free.dev/api/auth";

const addresses = {
  "Rodriguez Rizal": ["San Jose", "Geronimo", "Balite", "Burgos", "Macabud"],
  "Quezon City": ["Tandang Sora", "Batasan Hills", "Commonwealth", "Kamuning"],
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
    if (!name || !email || !password || !confirmPassword || !selectedCity || !selectedBarangay) {
      setError("All fields are required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");

    try {
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
      style={{ flex: 1, backgroundColor: "#ffe5e5" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>Register</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
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

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedBarangay("");
              }}
              style={{ width: "100%", height: 50 }}
            >
              <Picker.Item label="Select City" value="" />
              {Object.keys(addresses).map((city) => (
                <Picker.Item key={city} label={city} value={city} />
              ))}
            </Picker>
          </View>

          {selectedCity !== "" && (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedBarangay}
                onValueChange={(value) => setSelectedBarangay(value)}
                style={{ width: "100%", height: 50 }}
              >
                <Picker.Item label="Select Barangay" value="" />
                {addresses[selectedCity].map((barangay) => (
                  <Picker.Item key={barangay} label={barangay} value={barangay} />
                ))}
              </Picker>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  pickerWrapper: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginVertical: 8,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "red",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
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
    alignSelf: "flex-start",
    marginTop: 5,
  },
  linkText: {
    color: "blue",
    marginTop: 20,
    fontSize: 14,
  },
});