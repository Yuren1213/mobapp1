import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../contexts/ThemeContext";

// FAQ content
const faqs = [
  {
    question: "How do I place an order?",
    answer:
      "Browse the menu, select your favorite items, and add them to your cart. Then proceed to checkout.",
  },
  {
    question: "Can I modify my order?",
    answer:
      "Yes! You can modify your order before confirming checkout. After confirmation, contact us to make immediate changes.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Cash on Delivery and GCash.",
  },
  {
    question: "How can I track my order?",
    answer: "You can track your order in the 'My Orders' section of the app.",
  },
  {
    question: "Who do I contact for help?",
    answer:
      "You can reach out to us anytime via Facebook Messenger for faster response!",
  },
];

// 💀 Dark Theme
const blackTheme = {
  bg: "#000000",
  card: "rgba(30,30,30,0.6)",
  border: "rgba(255,255,255,0.1)",
  textPrimary: "#FFFFFF",
  textSecondary: "#AAAAAA",
  primary: "#0A84FF",
  contactButton: "#1877F2", // Messenger blue
  contactButtonText: "#FFFFFF",
};

// ☀️ Light Theme
const lightTheme = {
  bg: "#FFFFFF",
  card: "rgba(255,255,255,0.9)",
  border: "rgba(200,200,200,0.3)",
  textPrimary: "#111111",
  textSecondary: "#555555",
  primary: "#007AFF",
  contactButton: "#1877F2", // Messenger blue
  contactButtonText: "#FFFFFF",
};

export default function Help() {
  const navigation = useNavigation();
  const { darkMode } = useContext(ThemeContext);
  const theme = darkMode ? blackTheme : lightTheme;

  const [loading, setLoading] = useState(false);

  const contactSupport = async () => {
    setLoading(true);

    // Messenger deep link (opens Messenger app directly)
    const messengerAppURL = "fb-messenger://user-thread/102314261772411";
    const fallbackURL = "https://www.facebook.com/messages/t/102314261772411";

    try {
      const supported = await Linking.canOpenURL(messengerAppURL);
      if (supported) {
        await Linking.openURL(messengerAppURL);
      } else {
        // fallback to browser only if Messenger not installed
        await Linking.openURL(fallbackURL);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open Messenger or Facebook.");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: theme.bg, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={26}
            color={theme.primary}
          />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Help & Support
          </Text>
        </View>

        <View style={{ width: 30 }} />
      </View>

      {/* FAQ List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {faqs.map((faq, index) => (
          <View
            key={index}
            style={[
              styles.faqCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: darkMode ? "#000" : "#aaa",
              },
            ]}
          >
            <Text style={[styles.question, { color: theme.textPrimary }]}>
              {faq.question}
            </Text>
            <Text style={[styles.answer, { color: theme.textSecondary }]}>
              {faq.answer}
            </Text>
          </View>
        ))}

        {/* Contact Support Button */}
        <TouchableOpacity
          style={[
            styles.contactButton,
            {
              backgroundColor: theme.contactButton,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={contactSupport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.contactButtonText} />
          ) : (
            <Text
              style={[
                styles.contactButtonText,
                { color: theme.contactButtonText },
              ]}
            >
              Contact Support on Messenger
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 0.5,
    marginBottom: 20,
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  faqCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.6,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  contactButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
