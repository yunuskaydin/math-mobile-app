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

export default function HomeScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await SecureStore.getItemAsync("userToken");
      if (storedToken) {
        setToken(storedToken);
      }
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

  if (!token) {
    return (
      <View style={styles.container}>
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
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Folders</Text>
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.folderText}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleDeleteFolder(item.id)}>
              <Text style={styles.deleteText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TextInput
        style={styles.input}
        placeholder="New folder name"
        value={folderName}
        onChangeText={setFolderName}
      />
      <Button title="Create Folder" onPress={handleCreateFolder} />

      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 5,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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
