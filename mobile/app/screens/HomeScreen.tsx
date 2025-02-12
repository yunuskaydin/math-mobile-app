import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Folder } from "../../types/Folder";
import { Ionicons } from "@expo/vector-icons"; // For login/logout icon

export default function HomeScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await SecureStore.getItemAsync("userToken");
      setToken(storedToken || null);
    };

    fetchToken();
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await axios.get("http://10.0.2.2:8000/api/folders");
      setFolders(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://10.0.2.2:8000/api/login/", {
        username,
        password,
      });
      const userToken = response.data.token;
      await SecureStore.setItemAsync("userToken", userToken);
      setToken(userToken);
      setShowLogin(false); // Hide login form after successful login
      Alert.alert("Login successful!");
    } catch (error) {
      Alert.alert("Login failed", "Invalid credentials");
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    setToken(null);
  };

  const handleCreateFolder = async () => {
    if (!token) return Alert.alert("You must be logged in to create folders.");

    try {
      await axios.post(
        "http://10.0.2.2:8000/api/folders/",
        { name: folderName },
        { headers: { Authorization: `Token ${token}` } }
      );
      setFolderName("");
      fetchFolders();
    } catch (error) {
      console.error(error);
      Alert.alert("Error creating folder");
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!token) return Alert.alert("You must be logged in to delete folders.");

    try {
      await axios.delete(`http://10.0.2.2:8000/api/folders/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      fetchFolders();
    } catch (error) {
      console.error(error);
      Alert.alert("Error deleting folder");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with login/logout icon */}
      <View style={styles.header}>
        <Text style={styles.title}>Folders</Text>
        <TouchableOpacity
          onPress={() => (token ? handleLogout() : setShowLogin(true))}
        >
          <Ionicons
            name={token ? "log-out-outline" : "log-in-outline"}
            size={28}
            color="black"
          />
        </TouchableOpacity>
      </View>

      {/* Login Form (Only visible when showLogin is true) */}
      {showLogin && !token && (
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Login" onPress={handleLogin} />
        </View>
      )}

      {/* Folder List (Visible for all users) */}
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.folderText}>{item.name}</Text>
            {token && (
              <TouchableOpacity onPress={() => handleDeleteFolder(item.id)}>
                <Text style={styles.deleteText}>❌</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Folder Creation (Only for authenticated users) */}
      {token && (
        <>
          <TextInput
            style={styles.input}
            placeholder="New folder name"
            value={folderName}
            onChangeText={setFolderName}
          />
          <Button title="Create Folder" onPress={handleCreateFolder} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  loginContainer: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    borderRadius: 5,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  folderText: {
    fontSize: 18,
  },
  deleteText: {
    color: "red",
    fontSize: 18,
  },
});
