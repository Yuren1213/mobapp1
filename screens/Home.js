import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavorites } from "../FavoritesContext";
import { API_URL } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");

const bestSellers = [
  { id: 5, title: "Crispy kare-kare", price: 129, image: require("../assets/images/5.jpg") },
  { id: 2, title: "Sangyup Nori Bites", price: 199, image: require("../assets/images/2.jpg") },
  { id: 8, title: "Cordon Bleu", price: 139, image: require("../assets/images/11.jpg") },
];

export default function Home() {
  const navigation = useNavigation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { darkMode } = useContext(ThemeContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-width))[0];
  const [guestMode, setGuestMode] = useState(false);

  // 🔹 Load stored user, image, cart, and guest flag
  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const storedImage = await AsyncStorage.getItem("profileImage");
      const storedCart = await AsyncStorage.getItem("cart");
      const storedGuest = await AsyncStorage.getItem("guest");

      setGuestMode(storedGuest === "true");

      if (storedUser) setUser(JSON.parse(storedUser));
      else setUser(null);

      if (storedImage) setProfileImage(storedImage);

      const cart = storedCart ? JSON.parse(storedCart) : [];
      const uniqueProducts = [...new Set(cart.map((i) => i._id || i.id))];
      setCartCount(uniqueProducts.length);
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  // 🔹 Fetch all products
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/Product/all`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
      else console.warn("Failed to load products:", data.message);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    loadUserData();
    fetchProducts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      fetchProducts();
    }, [])
  );

  // 🔹 Fetch cart count
  const fetchCartCount = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/Cart/${userId}`);
      const data = await res.json();
      if (data.success) {
        const uniqueProducts = [...new Set(data.cart.map((i) => i.productId))];
        setCartCount(uniqueProducts.length);
      }
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  // 🔹 Add to cart function (matches Render backend)
  const addToCart = async (item) => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        Alert.alert("Login Required", "Please log in to add items to cart.");
        return;
      }

      const user = JSON.parse(storedUser);

      const payload = {
        userId: user?._id?.$oid || user?._id || user?.id,
        productId: item?._id || item?.id,
        quantity: 1,
      };

      console.log("🧾 Add to Cart Payload:", JSON.stringify(payload, null, 2));

      const res = await fetch(`${API_URL}/Cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Add to Cart Response:", data);

      if (res.ok && data.success) {
        Alert.alert("Added to Cart", `${item.prod_desc || item.title} has been added!`);
        fetchCartCount(payload.userId);

        // Store cart locally
        const storedCart = await AsyncStorage.getItem("cart");
        const cart = storedCart ? JSON.parse(storedCart) : [];
        cart.push(item);
        await AsyncStorage.setItem("cart", JSON.stringify(cart));
      } else {
        const message = data?.message || data?.title || "Failed to add item to cart.";
        Alert.alert("Error", message);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  };

  const toggleFavorite = (item) => {
    if (isFavorite(item._id || item.id)) removeFavorite(item._id || item.id);
    else addFavorite(item);
  };

  // Drawer animation
  const toggleDrawer = () => {
    if (drawerOpen) {
      Animated.timing(slideAnim, { toValue: -width, duration: 300, useNativeDriver: false }).start(() =>
        setDrawerOpen(false)
      );
    } else {
      setDrawerOpen(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  };

  // 🔎 Filter products
  const filteredProducts = searchQuery
    ? products.filter((p) => p.prod_desc?.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  // 🌙 Theme setup
  const theme = {
    bg: darkMode ? "black" : "#ffe6e6",
    card: darkMode ? "#1f1f1f" : "#fff",
    text: darkMode ? "#fff" : "#333",
    subText: darkMode ? "#aaa" : "#333",
    placeholder: darkMode ? "#888" : "#999",
    navBg: darkMode ? "#1a1a1a" : "#fff",
    navText: darkMode ? "#fff" : "#000",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }} onPress={toggleDrawer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: 35, height: 35, borderRadius: 18 }} />
          ) : (
            <Ionicons name="person-circle" size={35} color={theme.text} />
          )}
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, color: theme.text }}>
            {user ? `Hi, ${user.Name || user.name || "User"}!` : "Hi Guest!"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <MaterialCommunityIcons name="chef-hat" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* SEARCH BOX */}
      <View style={[styles.searchBox, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={27} color={darkMode ? "#ccc" : "#666"} />
        <TextInput
          placeholder="Search for your cravings"
          placeholderTextColor={theme.placeholder}
          style={[styles.searchInput, { color: theme.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* MAIN CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {!searchQuery && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cantina MNL’s Best Sellers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 15 }}>
              {bestSellers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.bestSellerCard, { backgroundColor: theme.card }]}
                  onPress={() => navigation.navigate("landing", { food: item })}
                >
                  <Image source={item.image} style={styles.bestSellerCardImage} />
                  <Text style={[styles.bestSellerTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.bestSellerPrice, { color: theme.subText }]}>₱{item.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Categories */}
            <View style={styles.categories}>
              <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate("Bento")}>
                <MaterialIcons name="restaurant-menu" size={22} color="deeppink" />
                <Text style={styles.categoryText}>Bento Meals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate("Foodtrays")}>
                <Ionicons name="fast-food" size={22} color="deeppink" />
                <Text style={styles.categoryText}>Party Trays</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate("Drinks")}>
                <FontAwesome5 name="glass-martini-alt" size={20} color="deeppink" />
                <Text style={styles.categoryText}>Drinks</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Product Grid */}
        <View style={styles.cardContainer}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={[styles.card, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate("landing", { food: product })}
              >
                <Image
                  source={
                    product.image_url && typeof product.image_url === "string"
                      ? { uri: product.image_url }
                      : require("../assets/images/1.jpg")
                  }
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <Text style={[styles.cardTitle, { color: theme.text }]}>{product.prod_desc}</Text>
                <Text style={[styles.cardPrice, { color: theme.subText }]}>₱{product.prod_unit_price}</Text>
                <View style={styles.cardFooter}>
                  <TouchableOpacity onPress={() => toggleFavorite(product)}>
                    <Ionicons
                      name={isFavorite(product._id) ? "heart" : "heart-outline"}
                      size={24}
                      color="red"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => addToCart(product)}>
                    <Ionicons name="add-circle" size={28} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: theme.subText, textAlign: "center", marginTop: 50 }}>No products found.</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg }]}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.navItem}>
          <Ionicons name="home" size={25} color={theme.navText} />
          <Text style={[styles.navLabel, { color: theme.navText }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!user}
          style={[styles.navItem, !user && { opacity: 0.5 }]}
          onPress={() => user && navigation.navigate("Favorites")}
        >
          <Ionicons name="heart" size={25} color={theme.navText} />
          <Text style={[styles.navLabel, { color: theme.navText }]}>Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={styles.navItem}>
          <Ionicons name="cart" size={25} color={theme.navText} />
          {cartCount > 0 && (
            <View style={styles.cartDot}>
              <Text style={styles.cartDotText}>{cartCount}</Text>
            </View>
          )}
          <Text style={[styles.navLabel, { color: theme.navText }]}>Cart</Text>
        </TouchableOpacity>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "black" }} />

      {/* Drawer */}
      {drawerOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleDrawer} />}
      <Animated.View style={[styles.drawer, { left: slideAnim, backgroundColor: theme.card }]}>
        <Text style={[styles.drawerTitle, { color: theme.text }]}>Profile</Text>

        <TouchableOpacity
          disabled={!user}
          style={[styles.drawerItem, !user && { opacity: 0.5 }]}
          onPress={() => user && navigation.navigate("Favorites")}
        >
          <Ionicons name="heart" size={22} color="deeppink" />
          <Text style={[styles.drawerText, { color: theme.text }]}>My Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!user}
          style={[styles.drawerItem, !user && { opacity: 0.5 }]}
          onPress={() => user && navigation.navigate("Myorders")}
        >
          <Ionicons name="book-outline" size={22} color="deeppink" />
          <Text style={[styles.drawerText, { color: theme.text }]}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!user}
          style={[styles.drawerItem, !user && { opacity: 0.5 }]}
          onPress={() => user && navigation.navigate("Payment")}
        >
          <Ionicons name="wallet-outline" size={22} color="deeppink" />
          <Text style={[styles.drawerText, { color: theme.text }]}>Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate("Help")}>
          <Ionicons name="help-circle-outline" size={22} color="deeppink" />
          <Text style={[styles.drawerText, { color: theme.text }]}>Help</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="cog-outline" size={22} color="deeppink" />
          <Text style={[styles.drawerText, { color: theme.text }]}>Settings</Text>
        </TouchableOpacity>

        {guestMode ? (
          <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.replace("Login")}>
            <Ionicons name="log-in" size={22} color="deeppink" />
            <Text style={[styles.drawerText, { color: theme.text }]}>Login</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={async () => {
              await AsyncStorage.clear();
              navigation.replace("Login");
            }}
          >
            <Ionicons name="log-out" size={22} color="deeppink" />
            <Text style={[styles.drawerText, { color: theme.text }]}>Logout</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15, paddingTop: 45, paddingBottom: 20, alignItems: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", marginHorizontal: 15, padding: 8, borderRadius: 10 },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", margin: 15 },
  cardContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", marginBottom: 10 },
  card: { width: 180, borderRadius: 12, padding: 10, marginBottom: 15, elevation: 5 },
  cardImage: { width: "100%", height: 120, borderRadius: 10, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: "bold" },
  cardPrice: { fontSize: 13, marginVertical: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8, borderTopWidth: 1, borderColor: "#333" },
  navItem: { alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 10, marginTop: 2 },
  cartDot: { position: "absolute", top: -5, right: -10, backgroundColor: "red", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  cartDotText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  bestSellerCard: { width: 140, borderRadius: 12, marginRight: 12, padding: 8, elevation: 5 },
  bestSellerCardImage: { width: "100%", height: 90, borderRadius: 8, marginBottom: 6 },
  bestSellerTitle: { fontSize: 13, fontWeight: "600" },
  bestSellerPrice: { fontSize: 12 },
  categories: { flexDirection: "row", justifyContent: "space-around", marginVertical: 15 },
  categoryButton: { alignItems: "center" },
  categoryText: { fontSize: 12, color: "deeppink", marginTop: 4 },
  drawer: { position: "absolute", top: 0, bottom: 0, width: width * 0.7, paddingHorizontal: 15, paddingTop: 45 },
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "#00000066" },
  drawerTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  drawerText: { marginLeft: 15, fontSize: 16 },
});
