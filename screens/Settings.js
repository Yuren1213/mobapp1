import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from "../contexts/ThemeContext";

const APP_VERSION = "v1.0.0";

const Settings = () => {
  const navigation = useNavigation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [profileImage, setProfileImage] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [editing, setEditing] = useState(false);
  const [tempInfo, setTempInfo] = useState({ name: "", email: "" });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  // Load saved data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedImage = await AsyncStorage.getItem("profileImage");
        const savedUser = await AsyncStorage.getItem("user");
        const savedNotif = await AsyncStorage.getItem("notificationsEnabled");

        if (savedImage) setProfileImage(savedImage);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUserInfo({
            name: parsed.name || "User",
            email: parsed.email || "",
          });
        }
        if (savedNotif !== null) setNotificationsEnabled(savedNotif === "true");
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };
    loadProfileData();
  }, []);

  // Save profile changes
  const saveProfile = async () => {
    try {
      setUserInfo(tempInfo);
      await AsyncStorage.setItem("user", JSON.stringify(tempInfo));
      setEditing(false);
      Alert.alert("Profile Updated", "Your information has been saved.");
    } catch (error) {
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  // Image Picker
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "We need access to your gallery.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setProfileImage(uri);
        await AsyncStorage.setItem("profileImage", uri);
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert("Error", "Something went wrong while picking the image.");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    Alert.alert("Logged Out", "You have been successfully logged out.");
    navigation.navigate("Login");
  };

  const handleResetData = async () => {
    Alert.alert(
      "Reset App Data",
      "Are you sure you want to clear all saved data?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Reset",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("App Reset", "All local data has been cleared.");
            navigation.navigate("Login");
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    const { current, newPass, confirm } = passwords;
    if (!current || !newPass || !confirm) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPass !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    // Here you’d call your backend endpoint
    Alert.alert("Success", "Your password has been changed.");
    setShowPasswordModal(false);
    setPasswords({ current: "", newPass: "", confirm: "" });
  };

  const theme = {
    bg: darkMode ? "#121212" : "#fff",
    text: darkMode ? "#fff" : "#333",
    card: darkMode ? "#1f1f1f" : "#f8f8f8",
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person-circle-outline" size={90} color="gray" />
              </View>
            )}
          </TouchableOpacity>

          {editing ? (
            <>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.text }]}
                placeholder="Enter name"
                placeholderTextColor={darkMode ? "#888" : "#aaa"}
                value={tempInfo.name}
                onChangeText={(text) => setTempInfo({ ...tempInfo, name: text })}
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.text }]}
                placeholder="Enter email"
                placeholderTextColor={darkMode ? "#888" : "#aaa"}
                value={tempInfo.email}
                onChangeText={(text) => setTempInfo({ ...tempInfo, email: text })}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: "deeppink" }]}
                  onPress={saveProfile}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: "deeppink" }]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={[styles.cancelText, { color: "deeppink" }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {userInfo.name || "My Profile"}
              </Text>
              {userInfo.email ? (
                <Text style={[styles.profileEmail, { color: theme.text }]}>
                  {userInfo.email}
                </Text>
              ) : null}
              <Text style={[styles.profileHint, { color: theme.text }]}>
                Tap below to edit profile info
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTempInfo(userInfo);
                  setEditing(true);
                }}
                style={styles.editProfileBtn}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
                <Text style={styles.editText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Options */}
        <View style={[styles.optionCard, { backgroundColor: theme.card }]}>
          <MaterialIcons name="dark-mode" size={22} color="deeppink" />
          <Text style={[styles.optionText, { color: theme.text }]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>

        <View style={[styles.optionCard, { backgroundColor: theme.card }]}>
          <Feather name="bell" size={22} color="deeppink" />
          <Text style={[styles.optionText, { color: theme.text }]}>
            Notifications
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={async (val) => {
              setNotificationsEnabled(val);
              await AsyncStorage.setItem("notificationsEnabled", val.toString());
            }}
          />
        </View>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: theme.card }]}
          onPress={() => setShowPasswordModal(true)}
        >
          <Ionicons name="key-outline" size={22} color="deeppink" />
          <Text style={[styles.optionText, { color: theme.text }]}>
            Change Password
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: theme.card }]}
          onPress={() => Linking.openURL("mailto:support@example.com")}
        >
          <Ionicons name="help-circle-outline" size={22} color="deeppink" />
          <Text style={[styles.optionText, { color: theme.text }]}>
            Help & Support
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: theme.card }]}
          onPress={handleResetData}
        >
          <Ionicons name="trash-outline" size={22} color="deeppink" />
          <Text style={[styles.optionText, { color: theme.text }]}>
            Reset App Data
          </Text>
        </TouchableOpacity>

        <Text style={{ textAlign: "center", color: theme.text, marginTop: 20 }}>
          App Version: {APP_VERSION}
        </Text>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              secureTextEntry
              placeholder="Current Password"
              value={passwords.current}
              onChangeText={(t) => setPasswords({ ...passwords, current: t })}
              style={styles.modalInput}
            />
            <TextInput
              secureTextEntry
              placeholder="New Password"
              value={passwords.newPass}
              onChangeText={(t) => setPasswords({ ...passwords, newPass: t })}
              style={styles.modalInput}
            />
            <TextInput
              secureTextEntry
              placeholder="Confirm New Password"
              value={passwords.confirm}
              onChangeText={(t) => setPasswords({ ...passwords, confirm: t })}
              style={styles.modalInput}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: "deeppink", flex: 1, marginRight: 5 }]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: "deeppink", flex: 1, marginLeft: 5 }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={[styles.cancelText, { color: "deeppink" }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  profileSection: { alignItems: "center", marginBottom: 25 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  profileName: { fontSize: 18, fontWeight: "bold" },
  profileEmail: { fontSize: 14, opacity: 0.8, marginTop: 3 },
  profileHint: { fontSize: 13, opacity: 0.6, marginTop: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "80%",
    marginTop: 8,
  },
  editButtons: { flexDirection: "row", marginTop: 12, gap: 10 },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  cancelText: { fontWeight: "bold", textAlign: "center" },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "deeppink",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  editText: { color: "#fff", fontWeight: "bold", marginLeft: 6 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionText: { fontSize: 15, marginLeft: 15 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "deeppink",
    borderRadius: 12,
    paddingVertical: 14,
    marginVertical: 25,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
});

export default Settings;
