import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ENDPOINTS } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CheckoutList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { darkMode } = useContext(ThemeContext);

  const { items = [], subtotal = 0, shippingFee = 0, total = 0 } = route?.params || {};
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentMode, setPaymentMode] = useState("COD");
  const [note, setNote] = useState(""); // 📝 New note field
  const [formData, setFormData] = useState({
    contactNumber: "",
    blk: "",
    lot: "",
    city: "",
    province: "",
    zipcode: "",
    barangay: "",
  });

  const modalAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const theme = {
    bg: darkMode ? "#121212" : "#f7f7f7",
    text: darkMode ? "#fff" : "#000",
    subText: darkMode ? "#aaa" : "#333",
    card: darkMode ? "#1f1f1f" : "#fff",
    inputBg: darkMode ? "#2c2c2c" : "#fff",
    inputBorder: darkMode ? "#555" : "#ccc",
    btnPrimary: "#007aff",
    btnDanger: "#ff3b30",
    modalBg: darkMode ? "#1f1f1f" : "#fff",
    placeOrderBtn: darkMode ? "#ff007f" : "#000",
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) closeModal();
        else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    })
  ).current;

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
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    })();
  }, []);

  const openModal = () => {
    setModalVisible(true);
    pan.setValue({ x: 0, y: 0 });
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.poly(4)),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      easing: Easing.in(Easing.poly(4)),
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const handleSaveChanges = async () => {
    try {
      const updated = { ...user, ...formData };
      setUser(updated);
      await AsyncStorage.setItem("user", JSON.stringify(updated));
      closeModal();
      Alert.alert("Success", "Information updated locally.");
    } catch (error) {
      console.error("Error saving info:", error);
      Alert.alert("Error", "Failed to save info.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !user._id) return Alert.alert("Error", "You must be logged in.");

    const orderData = {
      userId: user._id,
      name: user.name,
      email: user.email,
      items,
      subtotal: Number(subtotal) || 0,
      shippingFee: Number(shippingFee) || 0,
      total: Number(total) || 0,
      contactNumber: formData.contactNumber,
      blk: formData.blk,
      lot: formData.lot,
      city: formData.city,
      province: formData.province,
      zipcode: formData.zipcode,
      barangay: formData.barangay,
      paymentMode,
      note, // ✅ Added note in orderData
    };

    try {
      const response = await fetch(`${ENDPOINTS.ORDERS}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to place order");

      const storedCart = await AsyncStorage.getItem("cart");
      if (storedCart) {
        const cart = JSON.parse(storedCart);
        const remainingCart = cart.filter(
          (cartItem) => !items.some((orderedItem) => orderedItem._id === cartItem._id)
        );
        await AsyncStorage.setItem("cart", JSON.stringify(remainingCart));
      }

      Alert.alert("✅ Success", "Order placed successfully", [
        { text: "OK", onPress: () => navigation.navigate("Myorders") },
      ]);
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
    }
  };

  const getSafeImage = (image) => {
    if (image && typeof image === "string" && image.startsWith("http")) return { uri: image };
    return require("../assets/images/1.jpg");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>
        <Text style={[styles.header, { color: theme.text }]}>Checkout</Text>

        {user && (
          <View style={[styles.contactBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.contactLabel, { color: theme.text }]}>{user.name}</Text>
            <Text style={{ color: theme.subText }}>{user.contactNumber}</Text>
            <Text style={{ color: theme.subText }}>
              {user.blk} {user.lot}, {user.city}, {user.province}, {user.zipcode}
            </Text>

            <TouchableOpacity onPress={openModal} style={styles.editIcon}>
              <Ionicons name="create-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        <Animated.View style={{ opacity: fadeAnim }}>
          {items.map((item, idx) => (
            <View key={idx} style={[styles.itemBox, { backgroundColor: theme.card }]}>
              <Image
                source={getSafeImage(item.image_url || item.image)}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>
                  {item.prod_desc || item.title || "Unnamed Item"}
                </Text>
                <Text style={{ color: theme.subText }}>
                  ₱{formatCurrency(item.prod_unit_price || item.price)}
                </Text>
                <Text style={{ color: theme.subText }}>Qty: {item.quantity}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* 📝 Note Section */}
        <View style={[styles.noteBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.noteLabel, { color: theme.text }]}>Note:</Text>
          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: darkMode ? "#2c2c2c" : "#f0f0f0",
                color: theme.text,
              },
            ]}
            placeholder="Add Instructions"
            placeholderTextColor={darkMode ? "#888" : "#666"}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* 💰 Summary Section */}
        <View style={[styles.summaryBox, { backgroundColor: theme.card }]}>
          <Text style={{ color: theme.text }}>Subtotal: ₱{formatCurrency(subtotal)}</Text>
          <Text style={{ color: theme.text }}>Shipping: ₱{formatCurrency(shippingFee)}</Text>
          <Text style={{ fontWeight: "bold", color: theme.text }}>
            Total: ₱{formatCurrency(total)}
          </Text>
        </View>

        {/* 💳 Payment Mode */}
        <View style={[styles.paymentBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.paymentLabel, { color: theme.text }]}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {["COD", "GCash"].map((method) => (
              <TouchableOpacity
                key={method}
                onPress={() => setPaymentMode(method)}
                style={[
                  styles.paymentButton,
                  {
                    backgroundColor:
                      paymentMode === method ? theme.btnPrimary : theme.inputBg,
                    borderColor:
                      paymentMode === method ? theme.btnPrimary : theme.inputBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color: paymentMode === method ? "#fff" : theme.text,
                    fontWeight: "bold",
                  }}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.placeOrderBtn, { backgroundColor: theme.placeOrderBtn }]}
        onPress={handlePlaceOrder}
      >
        <Text style={styles.placeOrderText}>Place Order</Text>
        <Text style={styles.placeOrderPrice}>₱{formatCurrency(total)}</Text>
      </TouchableOpacity>

      {/* 🧾 Update Info Modal */}
      <Modal transparent visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.modalBg,
                transform: [{ translateY: Animated.add(modalAnim, pan.y) }],
              },
            ]}
          >
            <Text style={[styles.modalHeader, { color: theme.text }]}>Update Info</Text>
            {[
              "contactNumber",
              "blk",
              "lot",
              "city",
              "province",
              "zipcode",
              "barangay",
            ].map((k) => (
              <TextInput
                key={k}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder={k}
                placeholderTextColor={darkMode ? "#888" : "#999"}
                value={formData[k]}
                onChangeText={(t) => setFormData({ ...formData, [k]: t })}
              />
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalBtnCancel,
                  { backgroundColor: theme.btnDanger },
                ]}
                onPress={closeModal}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnUpdate,
                  { backgroundColor: theme.btnPrimary },
                ]}
                onPress={handleSaveChanges}
              >
                <Text style={styles.modalBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: "bold", margin: 16 },
  contactBox: { padding: 16, margin: 16, borderRadius: 12, position: "relative" },
  contactLabel: { fontSize: 18, fontWeight: "bold" },
  editIcon: { position: "absolute", top: 10, right: 10, padding: 6 },
  itemBox: { flexDirection: "row", margin: 16, borderRadius: 10 },
  itemImage: { width: 90, height: 90, borderRadius: 10 },
  itemInfo: { flex: 1, padding: 10 },
  itemTitle: { fontWeight: "bold" },

  // 📝 Note Section Styles
  noteBox: { marginHorizontal: 16, marginBottom: 10, borderRadius: 10, padding: 12 },
  noteLabel: { fontWeight: "bold", marginBottom: 6 },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },

  summaryBox: { margin: 16, padding: 12, borderRadius: 10 },
  paymentBox: { margin: 16, padding: 12, borderRadius: 10 },
  paymentLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  paymentOptions: { flexDirection: "row", justifyContent: "space-between" },
  paymentButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  placeOrderBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  placeOrderText: { color: "#fff", fontWeight: "bold" },
  placeOrderPrice: { color: "#fff", fontWeight: "bold" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalBtnCancel: { flex: 1, padding: 10, borderRadius: 10, marginRight: 6 },
  modalBtnUpdate: { flex: 1, padding: 10, borderRadius: 10, marginLeft: 6 },
  modalBtnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});

export default CheckoutList;
