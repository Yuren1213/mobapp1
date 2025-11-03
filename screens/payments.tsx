import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Button,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Linking,
} from "react-native";

type CreateLinkResponse = {
    checkout_url: string;
};

export default function PaymentsScreen(): JSX.Element {
    const [amount, setAmount] = useState<string>("100.00");
    const [currency, setCurrency] = useState<string>("PHP");
    const [description, setDescription] = useState<string>("Order payment");
    const [loading, setLoading] = useState<boolean>(false);

    // Replace this with your real backend endpoint that creates a Paymongo payment link
    const BACKEND_CREATE_LINK_URL = "https://your-backend.example.com/api/paymongo/create-payment-link";

    async function createAndOpenPaymentLink() {
        if (!amount || Number.isNaN(Number(amount))) {
            Alert.alert("Invalid amount", "Please enter a valid numeric amount.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                amount: Math.round(Number(amount) * 100), // cents/centavos as integer
                currency,
                description,
            };

            const res = await fetch(BACKEND_CREATE_LINK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error: ${res.status} ${text}`);
            }

            const data = (await res.json()) as CreateLinkResponse;
            if (!data?.checkout_url) throw new Error("No checkout_url returned from server");

            // Open in external browser
            const supported = await Linking.canOpenURL(data.checkout_url);
            if (!supported) throw new Error("Cannot open payment URL");
            await Linking.openURL(data.checkout_url);
        } catch (err: any) {
            console.error("createAndOpenPaymentLink error:", err);
            Alert.alert("Payment error", err.message ?? "Unable to create payment link");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pay with Paymongo</Text>

            <Text style={styles.label}>Amount ({currency})</Text>
            <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholder="100.00"
            />

            <Text style={styles.label}>Currency</Text>
            <TextInput style={styles.input} value={currency} onChangeText={setCurrency} />

            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} />

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" />
            ) : (
                <View style={styles.button}>
                    <Button title="Pay" onPress={createAndOpenPaymentLink} />
                </View>
            )}

            <Text style={styles.small}>
                Note: This screen expects a backend endpoint that creates a Paymongo payment link (server-side)
                using your Paymongo secret key and returns JSON { checkout_url: string }.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    title: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
    label: { marginTop: 12, marginBottom: 6, color: "#333" },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    button: { marginTop: 20 },
    small: { marginTop: 24, color: "#666", fontSize: 12 },
});