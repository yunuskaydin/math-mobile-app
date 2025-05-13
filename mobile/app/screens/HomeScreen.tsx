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
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
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
        { 
          name: folderName,
          parent: currentFolder?.id || null 
        },
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

  const handleFolderPress = (folder: Folder) => {
    setCurrentFolder(folder);
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
        <TouchableOpacity 
          onPress={() => setCurrentFolder(null)} 
          style={styles.backButton}
        >
          {currentFolder && <Ionicons name="arrow-back" size={24} color="black" />}
        </TouchableOpacity>
        <Text style={styles.title}>
          {currentFolder ? currentFolder.name : "Folders"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (token) {
              handleLogout();
            } else {
              setShowLogin(!showLogin);
            }
          }}
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
          <TouchableOpacity
            style={styles.createFolderButton}
            onPress={handleLogin}
          >
            <Text style={styles.createFolderButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Folder List (Visible for all users) */}
      <FlatList
        data={folders.filter(folder => 
          currentFolder 
            ? folder.parent === currentFolder?.id 
            : !folder.parent
        )}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.item}
            onPress={() => handleFolderPress(item)}
          >
            <Text style={styles.folderText}>{item.name}</Text>
            {token && (
              <TouchableOpacity onPress={() => handleDeleteFolder(item.id)}>
                <Text style={styles.deleteText}>❌</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.createFolderButton}
            onPress={handleCreateFolder}
          >
            <Text style={styles.createFolderButtonText}>Create Folder</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  createFolderButton: {
    backgroundColor: "#FF7F50", // Sunset Orange
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#FF4500", // Warm Glow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  createFolderButtonText: {
    color: "#FFF5E1", // Soft Sunset Yellow
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF3E0", // Soft peach background
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFAB91",
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#D84315", // Deep sunset orange
  },
  loginContainer: {
    width: "100%",
    padding: 20,
    backgroundColor: "#FFCCBC",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#FF8A65",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#D84315",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FF8A65",
    backgroundColor: "#FFE0B2",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  folderText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#BF360C",
  },
  deleteText: {
    color: "#B71C1C",
    fontSize: 18,
    fontWeight: "600",
  },
});
