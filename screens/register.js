import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import facebook from "../assets/images/facebook.png";
import google from "../assets/images/google.png";
import { API_URL } from "../config";

const addresses = {
  "Rodriguez Rizal": ["San Jose","Geronimo","Balite","Burgos","Macabud","Manggahan","Mascap","San Rafael","San Isidro"],
  "Quezon City": ["Tandang Sora","Batasan Hills","Commonwealth","Holy Spirit","Kaligayahan","Kamuning","Loyola Heights","Old Balara","Pasong Tamo","Project 6","Quirino 3-A","San Bartolome","San Isidro","Santa Lucia","Talayan","Bagong Pagasa"],
  Manila: ["Binondo","Ermita","Malate"],
  Makati: ["Poblacion","Bel-Air","San Antonio"],
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
      setError("All fields are required");
      return;
    }
    if (!email.includes("@gmail.com")) {
      setError("Email must contain '@gmail.com'");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, city: selectedCity, barangay: selectedBarangay }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Signup successful! Please log in.");
        navigation.navigate("Login");
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
            <TextInput style={styles.input} placeholder="Email/Phone number" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedCity} onValueChange={(value) => { setSelectedCity(value); setSelectedBarangay(""); }}>
                <Picker.Item label="Select City" value="" />
                {Object.keys(addresses).map((city) => (<Picker.Item key={city} label={city} value={city} />))}
              </Picker>
            </View>

            {selectedCity !== "" && (
              <View style={styles.pickerContainer}>
                <Picker selectedValue={selectedBarangay} onValueChange={(value) => setSelectedBarangay(value)}>
                  <Picker.Item label="Select Barangay" value="" />
                  {addresses[selectedCity].map((barangay) => (<Picker.Item key={barangay} label={barangay} value={barangay} />))}
                </Picker>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}><Text style={styles.signupText}>Signup</Text></TouchableOpacity>

            <View style={styles.dividerContainer}><View style={styles.line} /><Text style={styles.orText}>Or Continue with</Text><View style={styles.line} /></View>
            <View style={styles.socialContainer}><Image source={google} style={styles.socialIcon} /><Image source={facebook} style={styles.socialIcon} /></View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#ffe5e5", justifyContent: "center", alignItems: "center", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 20 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#000", justifyContent: "center", alignItems: "center", marginRight: 10 },
  backArrow: { fontSize: 22, color: "#fff", fontWeight: "bold", lineHeight: 36, textAlign: "center" },
  title: { fontSize: 22, fontWeight: "600" },
  form: { width: "100%", alignItems: "center" },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 20, padding: 10, marginVertical: 8, backgroundColor: "#fff" },
  pickerContainer: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 20, marginVertical: 8, backgroundColor: "#fff" },
  signupBtn: { backgroundColor: "red", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 20, marginTop: 10, width: "100%" },
  signupText: { color: "#fff", fontWeight: "bold", fontSize: 16, textAlign: "center" },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 20, width: "100%" },
  line: { flex: 1, height: 1, backgroundColor: "black" },
  orText: { marginHorizontal: 10, fontSize: 14 },
  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 20 },
  socialIcon: { width: 40, height: 40, marginHorizontal: 10 },
  errorText: { color: "red", fontSize: 12, alignSelf: "flex-start", marginBottom: 5, marginLeft: 5 },
});
