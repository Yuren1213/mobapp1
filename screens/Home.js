import { 
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavorites } from "../FavoritesContext";
import { API_URL } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");

const SkeletonCard = ({ width = 180, height = 150, style }) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  Animated.loop(
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    })
  ).start();

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[{ width, height, borderRadius: 12, backgroundColor: "#e0e0e0", overflow: "hidden", marginBottom: 15 }, style]}
    >
      <Animated.View
        style={{
          width: "50%",
          height: "100%",
          backgroundColor: "#f0f0f0",
          position: "absolute",
          left: 0,
          top: 0,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

export default function Home() {
  const navigation = useNavigation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { darkMode } = useContext(ThemeContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-width))[0];
  const [guestMode, setGuestMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBestSellers, setLoadingBestSellers] = useState(true);

  const initializedRef = useRef(false);
  const silentUpdateDoneRef = useRef(false);

  // ====== Load User & Cart ======
  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const storedImage = await AsyncStorage.getItem("profileImage");
      const storedCart = await AsyncStorage.getItem("cart");
      const storedGuest = await AsyncStorage.getItem("guest");

      setGuestMode(storedGuest === "true");
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setProfileImage(storedImage || null);

      const cart = storedCart ? JSON.parse(storedCart) : [];
      const uniqueIds = [...new Set(cart.map((i) => i._id || i.id))];
      setCartCount(uniqueIds.length);
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  // ====== Fetch Products ======
  const fetchProducts = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoadingProducts(true);
        setLoadingBestSellers(true);
      }

      const res = await fetch(`${API_URL}/Product/all`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        const bestSellerItems = data.products
          .filter(p => p.is_bestseller)
          .sort((a, b) => {
            if (a.prod_qty === 0 && b.prod_qty > 0) return 1;
            if (a.prod_qty > 0 && b.prod_qty === 0) return -1;
            return a.prod_unit_price - b.prod_unit_price;
          });
        setBestSellers(bestSellerItems);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoadingProducts(false);
      setLoadingBestSellers(false);
    }
  };

  const silentUpdateDisplayedProducts = async () => {
    if (silentUpdateDoneRef.current) return;
    silentUpdateDoneRef.current = true;

    const currentProducts = [...products];
    if (!currentProducts.length) return;

    let hasChanges = false;
    const updatedMap = new Map();

    await Promise.all(
      currentProducts.map(async (prod) => {
        try {
          const id = prod._id || prod.id;
          if (!id) return;

          const res = await fetch(`${API_URL}/Product/${id}`);
          if (!res.ok) return;

          const data = await res.json();
          const serverProduct = data.product || data.data || data;
          if (!serverProduct) return;

          const fields = ["prod_desc", "prod_qty", "prod_unit_price", "image_url", "title"];
          const changed = fields.some(f => {
            const oldVal = prod[f];
            const newVal = serverProduct[f];
            return typeof oldVal === "number" || typeof newVal === "number"
              ? Number(oldVal) !== Number(newVal)
              : (oldVal || "") !== (newVal || "");
          });

          if (changed) {
            hasChanges = true;
            updatedMap.set(id, { ...prod, ...serverProduct });
          }
        } catch (err) {
          console.warn("Silent update error:", err);
        }
      })
    );

    if (hasChanges) {
      const merged = products.map(p => updatedMap.get(p._id || p.id) || p);
      setProducts(merged);
      setBestSellers(
        merged.filter(p => p.is_bestseller).sort((a, b) => {
          if (a.prod_qty === 0 && b.prod_qty > 0) return 1;
          if (a.prod_qty > 0 && b.prod_qty === 0) return -1;
          return a.prod_unit_price - b.prod_unit_price;
        })
      );
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    silentUpdateDoneRef.current = false;
    await fetchProducts(true);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      if (!initializedRef.current) {
        initializedRef.current = true;
        (async () => {
          await fetchProducts(true);
          setTimeout(() => silentUpdateDisplayedProducts().catch(console.warn), 200);
        })();
      }
    }, [])
  );

  // ====== Cart Functions ======
  const fetchCartCount = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/Cart/${userId}`);
      const data = await res.json();
      if (data.success) {
        const uniqueIds = [...new Set(data.cart.map(i => i.productId))];
        setCartCount(uniqueIds.length);
      }
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

 const addToCart = async (item) => {
  try {
    if (item.prod_qty === 0) {
      return Alert.alert("Out of Stock", "This item is unavailable.");
    }

    const storedUser = await AsyncStorage.getItem("user");
    if (!storedUser) {
      return Alert.alert("Login Required", "Please log in to add items to cart.");
    }

    const user = JSON.parse(storedUser);

    const payload = {
      userId: user._id || user.id,
      productId: item._id || item.id,
      quantity: 1,
    };

    // ====== BACKEND CART UPDATE ======
    const res = await fetch(`${API_URL}/Cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return Alert.alert("Error", data?.message || "Failed to add item to cart.");
    }

    // ====== LOCAL CART UPDATE (FIXED) ======
    const storedCart = await AsyncStorage.getItem("cart");
    let cart = storedCart ? JSON.parse(storedCart) : [];

    const productId = item._id || item.id;

    // Check if product already exists
    const existingIndex = cart.findIndex(
      (p) => (p._id || p.id) === productId
    );

    if (existingIndex !== -1) {
      // increment quantity
      cart[existingIndex].quantity = Number(cart[existingIndex].quantity || 1) + 1;
    } else {
      // add new product with quantity 1
      cart.push({ ...item, quantity: 1 });
    }

    await AsyncStorage.setItem("cart", JSON.stringify(cart));

    // cart count update
    const uniqueIds = [...new Set(cart.map((i) => i._id || i.id))];
    setCartCount(uniqueIds.length);

    Alert.alert("Added to Cart", `${item.prod_desc || item.title} added!`);
  } catch (err) {
    console.error("Error adding to cart:", err);
    Alert.alert("Error", "Failed to add item to cart.");
  }
};


  const toggleFavorite = (item) => {
    if (isFavorite(item._id || item.id)) removeFavorite(item._id || item.id);
    else addFavorite(item);
  };

  const toggleDrawer = () => {
    if (drawerOpen) {
      Animated.timing(slideAnim, { toValue: -width, duration: 300, useNativeDriver: false }).start(() => setDrawerOpen(false));
    } else {
      setDrawerOpen(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  };

  const filteredProducts = searchQuery
    ? products.filter(p => p.prod_desc?.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const theme = {
    bg: darkMode ? "black" : "#ffe6e6",
    card: darkMode ? "#1f1f1f" : "#fff",
    text: darkMode ? "#fff" : "#333",
    subText: darkMode ? "#aaa" : "#333",
    placeholder: darkMode ? "#888" : "#999",
    navBg: darkMode ? "#1a1a1a" : "#fff",
    navText: darkMode ? "#fff" : "#000",
  };

  // ====== RETURN UI ======
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }} onPress={toggleDrawer}>
          {profileImage ? <Image source={{ uri: profileImage }} style={{ width: 35, height: 35, borderRadius: 18 }} /> : <Ionicons name="person-circle" size={35} color={theme.text} />}
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, color: theme.text }}>
            {user ? `Hi, ${user.Name || user.name || "User"}!` : "Hi Guest!"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <MaterialCommunityIcons name="chef-hat" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchBox, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={27} color={darkMode ? "#ccc" : "#666"} />
        <TextInput placeholder="Search for your cravings" placeholderTextColor={theme.placeholder} style={[styles.searchInput, { color: theme.text }]} value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {!searchQuery && (
          <>
            {loadingBestSellers ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 15 }}>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} width={140} height={130} style={{ marginRight: 12 }} />)}
              </ScrollView>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Cantina MNL’s Best Sellers</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 15 }}>
                  {bestSellers.map(item => {
                    const outOfStock = item.prod_qty === 0;
                    return (
                      <TouchableOpacity key={item._id} style={[styles.bestSellerCard, { backgroundColor: theme.card, opacity: outOfStock ? 0.6 : 1 }]} disabled={outOfStock} onPress={() => navigation.navigate("landing", { food: item })}>
                        <View style={{ position: "relative" }}>
                          <Image source={item.image_url ? { uri: item.image_url } : require("../assets/images/1.jpg")} style={styles.bestSellerCardImage} />
                          {outOfStock && <View style={styles.outOfStockOverlay}><Text style={styles.outOfStockText}>OUT OF STOCK</Text></View>}
                        </View>
                        <Text style={[styles.bestSellerTitle, { color: theme.text }]}>{item.prod_desc}</Text>
                        <Text style={[styles.bestSellerPrice, { color: theme.subText }]}>₱{item.prod_unit_price}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* CATEGORIES */}
            <View style={styles.categories}>
              <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate("Bento")}><MaterialIcons name="restaurant-menu" size={22} color="deeppink" /><Text style={styles.categoryText}>Bento Meals</Text></TouchableOpacity>
              <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate("Foodtrays")}><Ionicons name="fast-food" size={22} color="deeppink" /><Text style={styles.categoryText}>Party Trays</Text></TouchableOpacity>
              <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate("Drinks")}><FontAwesome5 name="glass-martini-alt" size={20} color="deeppink" /><Text style={styles.categoryText}>Drinks</Text></TouchableOpacity>
            </View>
          </>
        )}


        {/* PRODUCT GRID */}
        <View style={styles.cardContainer}>
          {loadingProducts && filteredProducts.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} width={180} height={180} />)
            : filteredProducts.length > 0
            ? filteredProducts.map(product => {
                const outOfStock = product.prod_qty === 0;
                return (
                  <TouchableOpacity key={product._id} style={[styles.card, { backgroundColor: theme.card, opacity: outOfStock ? 0.6 : 1 }]} disabled={outOfStock} onPress={() => !outOfStock && navigation.navigate("landing", { food: product })}>
                    <View style={{ position: "relative" }}>
                      <Image source={product.image_url && typeof product.image_url === "string" ? { uri: product.image_url } : require("../assets/images/1.jpg")} style={styles.cardImage} resizeMode="cover" />
                      {outOfStock && <View style={styles.outOfStockOverlay}><Text style={styles.outOfStockText}>OUT OF STOCK</Text></View>}
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{product.prod_desc}</Text>
                    <Text style={[styles.cardPrice, { color: theme.subText }]}>₱{product.prod_unit_price}</Text>
                    <View style={styles.cardFooter}>
                      <TouchableOpacity onPress={() => toggleFavorite(product)} disabled={outOfStock}><Ionicons name={isFavorite(product._id) ? "heart" : "heart-outline"} size={24} color="red" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => addToCart(product)} disabled={outOfStock}><Ionicons name="add-circle" size={28} color={theme.text} /></TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            : <Text style={{ color: theme.subText, textAlign: "center", marginTop: 50 }}>No products found.</Text>}
        </View>  
      </ScrollView>


      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBg }]}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.navItem}><Ionicons name="home" size={25} color={theme.navText} /><Text style={[styles.navLabel, { color: theme.navText }]}>Home</Text></TouchableOpacity>
        <TouchableOpacity disabled={!user} style={[styles.navItem, !user && { opacity: 0.5 }]} onPress={() => user && navigation.navigate("Favorites")}><Ionicons name="heart" size={25} color={theme.navText} /><Text style={[styles.navLabel, { color: theme.navText }]}>Favorites</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={styles.navItem}>
          <Ionicons name="cart" size={25} color={theme.navText} />
          {cartCount > 0 && <View style={styles.cartDot}><Text style={styles.cartDotText}>{cartCount}</Text></View>}
          <Text style={[styles.navLabel, { color: theme.navText }]}>Cart</Text>
        </TouchableOpacity>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "black" }} />
      {/* DRAWER */}
      {drawerOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleDrawer} />}
      <Animated.View style={[styles.drawer, { left: slideAnim, backgroundColor: theme.card }]}>
        <Text style={[styles.drawerTitle, { color: theme.text }]}>Profile</Text>
        {/* ...rest of drawer unchanged */}
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
              await AsyncStorage.removeItem("user");
              await AsyncStorage.removeItem("cart");
              await AsyncStorage.removeItem("guest");
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



// ====== STYLES ====== (unchanged from your version)
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15, paddingTop: 45, paddingBottom: 20, alignItems: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", marginHorizontal: 15, padding: 8, borderRadius: 10 },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", margin: 15 },
  cardContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", marginBottom: 10 },
  card: { width: 180, borderRadius: 12, padding: 10, marginBottom: 15, elevation: 5 },
  cardImage: { width: "100%", height: 120, borderRadius: 8 },
  cardTitle: { fontSize: 14, fontWeight: "bold", marginTop: 6 },
  cardPrice: { fontSize: 13, marginTop: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: "#ccc" },
  navItem: { alignItems: "center" },
  navLabel: { fontSize: 12 },
  cartDot: { position: "absolute", top: -4, right: -10, backgroundColor: "red", width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  cartDotText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
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
  outOfStockOverlay: { position: "absolute", top: "35%", left: 0, right: 0, alignItems: "center", transform: [{ rotate: "-30deg" }] },
  outOfStockText: { backgroundColor: "rgba(255, 0, 0, 0.8)", color: "#fff", fontWeight: "bold", paddingHorizontal: 20, paddingVertical: 5, borderRadius: 5, fontSize: 14, textAlign: "center" },
});
