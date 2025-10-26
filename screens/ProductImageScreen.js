import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator, Text } from "react-native";

const ProductImageScreen = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Replace with your ngrok link and product ID
  const productId = "68faf1f4fb6f954193ae9790";
  const API_URL = `https://untooled-rostrally-trent.ngrok-free.dev/api/Product/image/${productId}`;

  useEffect(() => {
    // Optional: You can verify the URL first
    setImageUrl(API_URL);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>Failed to load image.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <Text>No image found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 300,
    height: 300,
  },
});

export default ProductImageScreen;
