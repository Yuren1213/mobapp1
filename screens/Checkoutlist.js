import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENDPOINTS } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const Checkoutlist = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { darkMode } = useContext(ThemeContext);

  const { items = [], subtotal = 0, shippingFee = 0, total = 0 } = route?.params || {};
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [formData, setFormData] = useState({
    contactNumber: "",
    blk: "",
    lot: "",
    city: "",
    province: "",
    zipcode: "",
    barangay: "",
  });
  const [note, setNote] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const theme = {
    bg: darkMode ? "#121212" : "#f7f7f7",
    text: darkMode ? "#ffffff" : "#000000",
    textSecondary: darkMode ? "#aaaaaa" : "#333333",
    card: darkMode ? "#1e1e1e" : "#ffffff",
    inputBg: darkMode ? "#2c2c2c" : "#ffffff",
    inputBorder: darkMode ? "#555555" : "#cccccc",
    btnPrimary: darkMode ? "#0a84ff" : "#007aff",
    btnDanger: "#ff3b30",
    modalBg: darkMode ? "#1e1e1e" : "#ffffff",
    placeOrderBtn: darkMode ? "#ff007f" : "#000000",
    selectedOption: darkMode ? "#ff007f" : "#ffd6e8",
    border: darkMode ? "#444" : "#ccc",
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setFormData({
            contactNumber: parsed.contactNumber || "",
            blk: parsed.blk || "",
            lot: parsed.lot || "",
            city: parsed.city || "",
            province: parsed.province || "",
            zipcode: parsed.zipcode || "",
            barangay: parsed.barangay || "",
          });
          setNote(parsed.note || "");
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    })();
  }, []);

  const handleSaveChanges = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const updated = storedUser ? { ...JSON.parse(storedUser), ...formData } : { ...formData };
      await AsyncStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setModalVisible(false);
      Alert.alert("Success", "Information updated locally.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save info.");
    }
  };

  const validateDeliveryFields = () => {
    const { contactNumber, blk, lot, city, province, zipcode, barangay } = formData;
    if (!contactNumber || !blk || !lot || !city || !province || !zipcode || !barangay) {
      Alert.alert("Missing Information", "Please fill out all delivery details before placing your order.");
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) throw new Error("You must be logged in");
      const userData = JSON.parse(storedUser);

      if (deliveryOption === "DELIVERY" && !validateDeliveryFields()) return;

      const orderData = {
        UserId: userData.id || userData._id,
        Name: userData.Name || userData.name,
        Email: userData.Email || userData.email,
        Items: items.map((i) => ({
          ProductId: i._id,
          Title: i.title || i.prod_desc || i.bento_desc,
          Price: i.price || i.prod_unit_price || i.bento_price,
          Quantity: i.quantity,
        })),
        Subtotal: subtotal,
        ShippingFee: shippingFee,
        Total: total,
        DeliveryOption: deliveryOption,
        PaymentMethod: paymentMethod,
        Barangay: formData.barangay || userData.Barangay || "",
        City: formData.city || userData.City || "",
        Province: formData.province || userData.Province || "",
        Blk: formData.blk || userData.Blk || "",
        Lot: formData.lot || userData.Lot || "",
        Zipcode: formData.zipcode || userData.Zipcode || "",
        ContactNumber: formData.contactNumber || userData.ContactNumber || "",
        Note: note || "",
        Status: "PENDING",
      };

      const res = await fetch(`${ENDPOINTS.AUTH.replace("/auth", "/orders")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert("Success", "Order placed successfully! Status: Pending");
        await AsyncStorage.removeItem("cart");
        navigation.navigate("Home");
      } else {
        Alert.alert("Error", data.message || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong");
    }
  };

  const getSafeImage = (item) =>
    item.image || item.image_url
      ? { uri: item.image || item.image_url }
      : require("../assets/images/1.jpg");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme.text }]}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 220 }}>
        {deliveryOption === "DELIVERY" && user && (
          <View style={[styles.contactBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.contactLabel, { color: theme.text }]}>{user.name}</Text>
            <Text style={{ color: theme.textSecondary }}>{formData.contactNumber}</Text>
            <Text style={{ color: theme.textSecondary }}>
              {formData.blk} {formData.lot}, {formData.city}, {formData.province}, {formData.zipcode}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editIcon}>
              <Ionicons name="create-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        <Animated.View style={{ opacity: fadeAnim }}>
          {items.map((item, idx) => (
            <View key={idx} style={[styles.itemBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Image source={getSafeImage(item)} style={styles.itemImage} resizeMode="cover" />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.prod_desc || item.title}</Text>
                <Text style={{ color: theme.textSecondary }}>₱{item.prod_unit_price || item.price || 0}</Text>
                <Text style={{ color: theme.textSecondary }}>Qty: {item.quantity || 1}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={[styles.summaryBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text }}>Subtotal: ₱{formatCurrency(subtotal)}</Text>
          <Text style={{ color: theme.text }}>Shipping: ₱{formatCurrency(shippingFee)}</Text>
          <Text style={{ fontWeight: "bold", color: theme.text }}>Total: ₱{formatCurrency(total)}</Text>
        </View>

        <View style={[styles.notesBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>Notes:</Text>
          <TextInput
            style={[
              styles.noteInput,
              { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder },
            ]}
            placeholder="Add notes for your order (optional)"
            placeholderTextColor={theme.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        <View style={{ margin: 16 }}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>Delivery Option:</Text>
          <View style={styles.options}>
            {["DELIVERY", "PICKUP"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.option,
                  {
                    borderColor: theme.border,
                    backgroundColor: deliveryOption === opt ? theme.selectedOption : theme.card,
                  },
                ]}
                onPress={() => setDeliveryOption(opt)}
              >
                <Text style={{ color: theme.text }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.optionTitle, { color: theme.text, marginTop: 10 }]}>Payment Method:</Text>
          <View style={styles.options}>
            {["CASH", "ONLINE"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.option,
                  {
                    borderColor: theme.border,
                    backgroundColor: paymentMethod === opt ? theme.selectedOption : theme.card,
                  },
                ]}
                onPress={() => setPaymentMethod(opt)}
              >
                <Text style={{ color: theme.text }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Delivery Info</Text>
            {Object.keys(formData).map((key) => (
              <TextInput
                key={key}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder },
                ]}
                value={formData[key]}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
              />
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: theme.btnDanger }]}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChanges}
                style={[styles.modalBtn, { backgroundColor: theme.btnPrimary }]}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ backgroundColor: theme.bg }}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, { backgroundColor: theme.placeOrderBtn }]}
          onPress={placeOrder}
        >
          <Text style={styles.placeOrderText}>Place Order</Text>
          <Text style={styles.placeOrderPrice}>₱{formatCurrency(total)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 5,
  },
  header: { fontSize: 22, fontWeight: "bold" },
  contactBox: {
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 10,
    position: "relative",
    borderWidth: 1,
  },
  contactLabel: { fontSize: 16, fontWeight: "bold" },
  editIcon: { position: "absolute", right: 10, top: 10 },
  itemBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemImage: { width: 80, height: 80, borderRadius: 10 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 16, fontWeight: "bold" },
  summaryBox: { margin: 10, padding: 15, borderRadius: 12, borderWidth: 1 },
  notesBox: { margin: 10, padding: 15, borderRadius: 12, borderWidth: 1 },
  noteInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    textAlignVertical: "top",
    minHeight: 60,
  },
  options: { flexDirection: "row", marginTop: 10 },
  option: { padding: 10, borderWidth: 1, borderRadius: 6, marginRight: 10 },
  optionTitle: { fontWeight: "bold" },
  placeOrderBtn: {
    margin: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  placeOrderText: { color: "#fff", fontWeight: "bold" },
  placeOrderPrice: { color: "#fff", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 6, padding: 10, marginVertical: 5 },
  modalBtn: { padding: 10, borderRadius: 6, width: "45%", alignItems: "center" },
});

export default Checkoutlist;