import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENDPOINTS } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

const Checkoutlist = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { darkMode } = useContext(ThemeContext);

  const { items = [], subtotal = 0, shippingFee: initialShippingFee = 0 } = route?.params || {};
  const [shippingFee, setShippingFee] = useState(initialShippingFee);
  const [total, setTotal] = useState(subtotal + initialShippingFee);
  const shippingTimeout = useRef(null);

  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false); // edit delivery modal
  const [qrVisible, setQrVisible] = useState(false); // QR modal
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
    address: "",
  });
  const [note, setNote] = useState("");

  // new: reference number entered by user when they choose ONLINE payment
  const [paymentReference, setPaymentReference] = useState("");

  const [customerLocation, setCustomerLocation] = useState({
    latitude: 14.728089,
    longitude: 121.142296,
  });
  const [mapLoading, setMapLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // store coordinates (used for distance calc)
  const STORE_COORDS = { latitude: 14.728808277383203, longitude: 121.14048267183851 };

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

  // Compose address from fields (combined)
  const composeAddress = (data = formData) => {
    const parts = [
      data.address,
      data.blk ? `Blk ${data.blk}` : "",
      data.lot ? `Lot ${data.lot}` : "",
      data.barangay,
      data.city,
      data.province,
      data.zipcode,
    ]
      .filter(Boolean)
      .join(", ");
    return parts;
  };

  // -------------------------
  // Permission helper
  // -------------------------
  const ensureLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location services (while using the app) to use map/address features."
        );
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Permission error:", err);
      Alert.alert("Error", "Could not request location permission.");
      return false;
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);

          const userId = parsed.id || parsed._id || parsed.userId;
          if (!userId) return;

          const savedDelivery = await AsyncStorage.getItem(`deliveryInfo_${userId}`);
          if (savedDelivery) {
            const parsedDelivery = JSON.parse(savedDelivery);
            setFormData(parsedDelivery);

            // If saved delivery has address-like fields, try to move pin
            const combined = composeAddress(parsedDelivery);
            if (combined && combined.length > 5) {
              // move pin will request permission internally
              movePinToAddress(combined);
            }
          } else {
            setFormData({
              contactNumber: parsed.contactNumber || "",
              blk: "",
              lot: "",
              city: "",
              province: "",
              zipcode: "",
              barangay: "",
              address: "",
            });
          }

          setNote(parsed.note || "");
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deliveryOption === "PICKUP") {
      setShippingFee(0);
      setTotal(subtotal);
    } else {
      setTotal(subtotal + shippingFee);
    }
  }, [deliveryOption, subtotal, shippingFee]);

  useEffect(() => {
    // keep total updated when subtotal or shipping changes
    if (deliveryOption !== "PICKUP") setTotal(subtotal + shippingFee);
    else setTotal(subtotal);
  }, [subtotal, shippingFee, deliveryOption]);

  const handleSaveChanges = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) throw new Error("No user logged in");

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser.id || parsedUser._id || parsedUser.userId;
      if (!userId) throw new Error("User ID missing");

      await AsyncStorage.setItem(`deliveryInfo_${userId}`, JSON.stringify(formData));
      setModalVisible(false);
      Alert.alert("Success", "Delivery info saved.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save info.");
    }
  };

  const validateDeliveryFields = () => {
    const { contactNumber, blk, lot, city, province, zipcode, barangay } = formData;
    if (!contactNumber || !blk || !lot || !city || !province || !zipcode || !barangay) {
      Alert.alert("Missing Info", "Please fill out all delivery details.");
      return false;
    }
    return true;
  };

  // -------------------------
  // Geocode combined address -> move pin (requests permission first)
  // -------------------------
  const movePinToAddress = async (address) => {
    if (!address || address.length < 5) {
      Alert.alert("Address too short", "Please provide a more complete address.");
      return;
    }

    const ok = await ensureLocationPermission();
    if (!ok) return;

    try {
      setMapLoading(true);
      const geocode = await Location.geocodeAsync(address);
      if (geocode && geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        setCustomerLocation({ latitude, longitude });
      } else {
        Alert.alert("Address not found", "You can drag the pin manually or try a different address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      Alert.alert("Address lookup failed", "You can drag the pin manually.");
    } finally {
      setMapLoading(false);
    }
  };

  // -------------------------
  // Reverse geocode coordinates -> fill parts of form (requests permission first)
  // -------------------------
  const reverseGeocodeAndFill = async (coords) => {
    const ok = await ensureLocationPermission();
    if (!ok) return;

    try {
      setMapLoading(true);
      const places = await Location.reverseGeocodeAsync(coords);
      const place = Array.isArray(places) && places.length > 0 ? places[0] : null;
      if (place) {
        const newForm = {
          ...formData,
          address: place.street || formData.address || "",
          barangay: place.subregion || place.subLocality || formData.barangay || "",
          city: place.city || place.region || formData.city || "",
          province: place.region || formData.province || "",
          zipcode: place.postalCode || formData.zipcode || "",
        };
        setFormData(newForm);
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    } finally {
      setMapLoading(false);
    }
  };

  // -------------------------
  // Distance calculation
  // -------------------------
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recalculate shipping when customerLocation changes (debounced a little)
  useEffect(() => {
    if (deliveryOption !== "DELIVERY") return;
    if (shippingTimeout.current) clearTimeout(shippingTimeout.current);

    shippingTimeout.current = setTimeout(() => {
      const distanceKm = calculateDistanceKm(
        STORE_COORDS.latitude,
        STORE_COORDS.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      );
      // fee formula: round(distanceKm * 50)
      const fee = Math.round(distanceKm * 50);
      setShippingFee(fee);
    }, 500);

    return () => clearTimeout(shippingTimeout.current);
  }, [customerLocation, deliveryOption]);

  const placeOrder = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) throw new Error("You must be logged in");
      const userData = JSON.parse(storedUser);

      if (deliveryOption === "DELIVERY" && !validateDeliveryFields()) return;

      for (const item of items) {
        const stockRes = await fetch(`${ENDPOINTS.AUTH.replace("/auth", "/product/order")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ProductId: item._id, Quantity: item.quantity }),
        });
        const stockData = await stockRes.json();
        if (!stockRes.ok || !stockData.success) {
          Alert.alert(
            "Error",
            `Failed to update stock for ${item.prod_desc || item.title}: ${stockData.message}`
          );
          return;
        }
      }

      const orderData = {
        UserId: userData.id || userData._id || userData.userId,
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
        Barangay: formData.barangay,
        City: formData.city,
        Province: formData.province,
        Blk: formData.blk,
        Lot: formData.lot,
        Zipcode: formData.zipcode,
        ContactNumber: formData.contactNumber,
        Note: note || "",
        Status: "PENDING",
        // include payment reference if provided
        PaymentReference: paymentReference || undefined,
      };

      const res = await fetch(`${ENDPOINTS.AUTH.replace("/auth", "/orders")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert("Success", "Order placed successfully!");
        const currentCart = JSON.parse(await AsyncStorage.getItem("cart")) || [];
        const updatedCart = currentCart.filter(
          (cartItem) => !items.some((orderedItem) => orderedItem._id === cartItem._id)
        );
        await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
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
    item.image || item.image_url ? { uri: item.image || item.image_url } : require("../assets/images/1.jpg");

  // -------------------------
  // Use device current location and reverse geocode to populate form (permission checked)
  // -------------------------
  const useCurrentLocation = async () => {
    const ok = await ensureLocationPermission();
    if (!ok) return;

    try {
      setMapLoading(true);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCustomerLocation(coords);
      await reverseGeocodeAndFill(coords);
    } catch (err) {
      console.error("Current location error:", err);
      Alert.alert("Error", "Could not get current location.");
    } finally {
      setMapLoading(false);
    }
  };
const isPlaceOrderDisabled = paymentMethod === "ONLINE" && (!paymentReference || paymentReference.trim().length < 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme.text }]}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Delivery Info */}
        {deliveryOption === "DELIVERY" && user && (
          <View style={[styles.contactBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.contactLabel, { color: theme.text }]}>{user.name || user.Name}</Text>
            <Text style={{ color: theme.textSecondary }}>{formData.contactNumber}</Text>
            <Text style={{ color: theme.textSecondary }}>
              {formData.blk} {formData.lot}, {formData.city}, {formData.province}, {formData.zipcode}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editIcon}>
              <Ionicons name="create-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Map */}
        {deliveryOption === "DELIVERY" && (
          <View style={{ margin: 10 }}>
            <MapView
              style={{ height: 300 }}
              initialRegion={{
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              region={{
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={STORE_COORDS} pinColor="blue" title="Store" />
              <Marker
                coordinate={customerLocation}
                draggable
                pinColor="red"
                title="Your Location"
                onDragEnd={(e) => {
                  const coords = e.nativeEvent.coordinate;
                  setCustomerLocation(coords);
                  // reverse geocode to fill some fields optionally (permission checked inside)
                  reverseGeocodeAndFill(coords);
                }}
              />
            </MapView>

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => movePinToAddress(composeAddress())}
                style={[styles.modalBtn, { backgroundColor: theme.btnPrimary, flex: 1 }]}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>Locate from Address</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={useCurrentLocation}
                style={[styles.modalBtn, { backgroundColor: theme.placeOrderBtn, flex: 1, marginLeft: 8 }]}
              >
                {mapLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", textAlign: "center" }}>Use Current Location</Text>}
              </TouchableOpacity>
            </View>
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

        {/* Summary */}
        <View style={[styles.summaryBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text }}>Subtotal: ₱{formatCurrency(subtotal)}</Text>
          <Text style={{ color: theme.text }}>Shipping: ₱{formatCurrency(shippingFee)}</Text>
          <Text style={{ fontWeight: "bold", color: theme.text }}>Total: ₱{formatCurrency(total)}</Text>
        </View>

        {/* Notes */}
        <View style={[styles.notesBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>Notes:</Text>
          <TextInput
            style={[styles.noteInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }]}
            placeholder="Add notes for your order (optional)"
            placeholderTextColor={theme.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        {/* Options */}
        <View style={{ margin: 16 }}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>Delivery Option:</Text>
          <View style={styles.options}>
            {["DELIVERY", "PICKUP"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.option,
                  { borderColor: theme.border, backgroundColor: deliveryOption === opt ? theme.selectedOption : theme.card },
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
                  { borderColor: theme.border, backgroundColor: paymentMethod === opt ? theme.selectedOption : theme.card },
                ]}
                onPress={() => {
                  setPaymentMethod(opt);
                  // when user selects ONLINE, show QR modal so they can scan and enter a reference number
                  if (opt === "ONLINE") {
                    setPaymentReference("");
                    setQrVisible(true);
                  } else {
                    setQrVisible(false);
                    setPaymentReference("");
                  }
                }}
              >
                <Text style={{ color: theme.text }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

       {/* Place Order Button */}
<View style={{ margin: 16 }}>
  {/* Hint if ONLINE payment but reference is missing */}
  {isPlaceOrderDisabled && paymentMethod === "ONLINE" && (
    <Text style={{ color: "red", marginBottom: 5 }}>
      Enter your payment reference to enable Place Order
    </Text>
  )}

  <TouchableOpacity
    style={[
      styles.placeOrderBtn,
      {
        backgroundColor: isPlaceOrderDisabled ? "#ccc" : theme.placeOrderBtn,
        opacity: isPlaceOrderDisabled ? 0.6 : 1,
      },
    ]}
    onPress={placeOrder}
    disabled={isPlaceOrderDisabled}
  >
    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>Place Order</Text>
  </TouchableOpacity>
</View>

      </ScrollView>

      {/* QR Modal: shows QR + TextInput below for reference number */}
      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { alignItems: "center", padding: 20, backgroundColor: theme.modalBg }]}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10, color: theme.text }}>Scan to Pay</Text>

            {/* QR Code - you can change the value to match the required scheme */}
            <QRCode value={`G-cash://pay?phone=09389916778&amount=${formatCurrency(total)}`} size={200} />

            <Text style={{ marginTop: 10, color: theme.text }}>Amount: ₱{formatCurrency(total)}</Text>

            {/* Reference number input below QR */}
            <TextInput
              placeholder="Enter reference / transaction number"
              placeholderTextColor={theme.textSecondary}
              value={paymentReference}
              onChangeText={setPaymentReference}
              style={[
                styles.input,
                { width: "100%", marginTop: 16, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder },
              ]}
              autoCapitalize="none"
              keyboardType="default"
            />

            <View style={{ flexDirection: "row", marginTop: 16, width: "100%" }}>
              <TouchableOpacity
                onPress={() => {
                  // Close modal but keep paymentMethod as ONLINE (they already selected it)
                  setQrVisible(false);
                }}
                style={[styles.modalBtn, { backgroundColor: theme.btnDanger }]}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (!paymentReference || paymentReference.trim().length < 3) {
                    // optional: require some minimal length
                    Alert.alert("Reference Required", "Please enter your payment reference number (from your payment app). ");
                    return;
                  }
                  // keep the reference so it can be submitted with the order
                  setQrVisible(false);
                  Alert.alert("Reference Saved", "Your payment reference has been saved.");
                }}
                style={[styles.modalBtn, { backgroundColor: theme.btnPrimary }]}
              >
                <Text style={{ color: "#fff" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Delivery Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { paddingBottom: 20 }]}>
          <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Delivery Info</Text>

            {Object.keys(formData).map((key) => (
              <TextInput
                key={key}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }]}
                value={formData[key]}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                onEndEditing={() => {
                  // When user finishes editing any delivery field, combine everything and geocode
                  const combined = composeAddress({ ...formData });
                  // small guard: only try geocode if combined is reasonably long
                  if (combined && combined.length > 5) {
                    // Update the combined address into state (so next open shows it)
                    setFormData((prev) => ({ ...prev, address: prev.address }));
                    movePinToAddress(composedAddressForMove({ ...formData }));
                  }
                }}
              />
            ))}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: theme.btnDanger }]}>
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveChanges} style={[styles.modalBtn, { backgroundColor: theme.btnPrimary }]}>
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// small helper to ensure we build address for movePinToAddress with latest typed field
const composedAddressForMove = (data) => {
  const parts = [
    data.address,
    data.blk ? `Blk ${data.blk}` : "",
    data.lot ? `Lot ${data.lot}` : "",
    data.barangay,
    data.city,
    data.province,
    data.zipcode,
  ]
    .filter(Boolean)
    .join(", ");
  return parts;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 10 },
  backButton: { marginRight: 10 },
  header: { fontSize: 20, fontWeight: "bold" },
  contactBox: { borderWidth: 1, borderRadius: 8, padding: 10, margin: 10, position: "relative" },
  contactLabel: { fontWeight: "bold", fontSize: 16 },
  editIcon: { position: "absolute", top: 10, right: 10 },
  itemBox: { flexDirection: "row", padding: 10, borderWidth: 1, borderRadius: 8, margin: 10 },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  itemInfo: { flex: 1, justifyContent: "center" },
  itemTitle: { fontWeight: "bold", fontSize: 14 },
  summaryBox: { padding: 10, borderWidth: 1, borderRadius: 8, margin: 10 },
  notesBox: { padding: 10, borderWidth: 1, borderRadius: 8, margin: 10 },
  optionTitle: { fontWeight: "bold", marginBottom: 5 },
  noteInput: { height: 60, borderWidth: 1, borderRadius: 8, padding: 8 },
  options: { flexDirection: "row", marginBottom: 10 },
  option: { padding: 10, borderWidth: 1, borderRadius: 8, marginRight: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", borderRadius: 10, padding: 10 },
  modalTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, marginBottom: 8, paddingHorizontal: 8 },
  modalBtn: { padding: 10, borderRadius: 8, alignItems: "center", flex: 1, marginHorizontal: 5 },
  placeOrderBtn: { padding: 16, alignItems: "center", borderRadius: 8 },
});

export default Checkoutlist;
