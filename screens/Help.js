
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Browse the menu, select your favorite items, and add them to your cart. Then proceed to checkout."
  },
  {
    question: "Can I modify my order?",
    answer: "Yes! You can modify your order before confirming checkout. After confirmation, contact support immediately."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Cash on Delivery, GCash, and Credit/Debit Cards."
  },
  {
    question: "How can I track my order?",
    answer: "You can track your order in the 'My Orders' section of the app."
  },
  {
    question: "Who do I contact for help?",
    answer: "You can reach out to our support team via email or phone using the button below."
  },
];

const Help = () => {
  const navigation = useNavigation();

  const contactSupport = () => {
    Linking.openURL("mailto:support@cantinamnl.com").catch(() =>
      Alert.alert("Error", "Could not open mail app")
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 28 }} /> {/* placeholder for alignment */}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqCard}>
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.answer}>{faq.answer}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.contactButton} onPress={contactSupport}>
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffe6e6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "black" },
  content: { paddingHorizontal: 15 },
  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 1,
  },
  question: { fontSize: 15, fontWeight: "bold", marginBottom: 5, color: "#333" },
  answer: { fontSize: 14, color: "#555" },
  contactButton: {
    backgroundColor: "deeppink",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  contactButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default Help;
