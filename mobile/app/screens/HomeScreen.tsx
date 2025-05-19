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
  Modal,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Folder } from "../../types/Folder";
import { Ionicons } from "@expo/vector-icons"; // For login/logout icon
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { API_ENDPOINTS } from "../config/api";

interface Video {
  id: number;
  title: string;
  youtube_url: string;
  folder: number | null;
  created_at: string;
}

export default function HomeScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await SecureStore.getItemAsync("userToken");
      setToken(storedToken || null);
    };

    fetchToken();
    fetchFolders();
    fetchVideos();
  }, [currentFolder]);

  const fetchFolders = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.FOLDERS);
      setFolders(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      console.log('Fetching videos...');
      const response = await axios.get(API_ENDPOINTS.VIDEOS);
      console.log('Videos fetched:', response.data);
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      });
      const userToken = response.data.token;
      await SecureStore.setItemAsync("userToken", userToken);
      setToken(userToken);
      setShowLogin(false);
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
    if (!token) {
      Alert.alert("Error", "You must be logged in to create folders");
      return;
    }

    if (!folderName) {
      Alert.alert("Error", "Please enter a folder name");
      return;
    }

    try {
      await axios.post(
        API_ENDPOINTS.FOLDERS,
        { 
          name: folderName,
          parent: currentFolder?.id || null 
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      setFolderName("");
      setShowFolderModal(false);
      fetchFolders();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create folder");
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!token) return Alert.alert("You must be logged in to delete folders.");

    try {
      await axios.delete(`${API_ENDPOINTS.FOLDERS}/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      fetchFolders();
    } catch (error) {
      console.error(error);
      Alert.alert("Error deleting folder");
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!token) return Alert.alert("You must be logged in to delete videos.");

    try {
      await axios.delete(`${API_ENDPOINTS.VIDEOS}${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      fetchVideos();
    } catch (error) {
      console.error(error);
      Alert.alert("Error deleting video");
    }
  };

  const handleFolderPress = (folder: Folder) => {
    setCurrentFolder(folder);
  };

  const handleVideoPress = (video: Video) => {
    if (video.youtube_url) {
      setSelectedVideo(video);
      setShowVideoPlayer(true);
    }
  };

  const extractVideoId = (url: string): string | null => {
    try {
      let videoId = '';
      
      if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
      } else if (url.includes('youtube.com')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.length === 11) {
        videoId = url;
      } else {
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        videoId = videoIdMatch ? videoIdMatch[1] : '';
      }

      return videoId && videoId.length === 11 ? videoId : null;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  };

  // Cleanup video when modal is closed
  useEffect(() => {
    if (!showVideoPlayer) {
      cleanupVideo();
    }
  }, [showVideoPlayer]);

  const handleOpenInYouTube = () => {
    if (selectedVideo?.youtube_url) {
      Linking.openURL(selectedVideo.youtube_url);
      setShowVideoPlayer(false);
    }
  };

  const getYouTubeEmbedHtml = (url: string) => {
    try {
      let videoId = '';
      
      if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
      } else if (url.includes('youtube.com')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.length === 11) {
        videoId = url;
      } else {
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        videoId = videoIdMatch ? videoIdMatch[1] : '';
      }

      if (!videoId || videoId.length !== 11) {
        return null;
      }

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
              body { margin: 0; background-color: black; }
              .video-container {
                position: relative;
                width: 100%;
                height: 100vh;
                overflow: hidden;
              }
              iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 0;
              }
            </style>
          </head>
          <body>
            <div class="video-container">
              <iframe
                src="https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0&origin=${encodeURIComponent('https://www.youtube.com')}&enablejsapi=1&autoplay=0&controls=1&showinfo=0&iv_load_policy=3&fs=1&hl=en&cc_load_policy=0&disablekb=1&mute=0&loop=0&playlist=${videoId}&widgetid=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                frameborder="0"
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
              ></iframe>
            </div>
          </body>
        </html>
      `;
    } catch (error) {
      console.error('Error creating YouTube embed HTML:', error);
      return null;
    }
  };

  const handleCreateVideo = async () => {
    if (!token) {
      Alert.alert("Error", "You must be logged in to add videos");
      return;
    }

    if (!videoUrl || !videoName) {
      Alert.alert("Error", "Please enter both video name and URL");
      return;
    }

    const cleanedUrl = videoUrl.trim();
    const videoId = extractVideoId(cleanedUrl);
    if (!videoId) {
      Alert.alert("Error", "Invalid YouTube URL");
      return;
    }

    try {
      const response = await axios.post(
        API_ENDPOINTS.VIDEOS,
        {
          title: videoName,
          youtube_url: cleanedUrl,
          folder: currentFolder?.id || null
        },
        { 
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      setVideoUrl("");
      setVideoName("");
      setShowVideoModal(false);
      Alert.alert("Success", "Video added successfully");
    } catch (error: any) {
      console.error('Error creating video:', error.response?.data || error.message);
      if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'object' 
          ? Object.values(error.response.data).join('\n')
          : error.response.data;
        Alert.alert("Error", `Failed to add video: ${errorMessage}`);
      } else {
        Alert.alert("Error", "Failed to add video. Please try again.");
      }
    }
  };

  const cleanupVideo = async () => {
    if (selectedVideo && selectedVideo.youtube_url) {
      try {
        const videoId = extractVideoId(selectedVideo.youtube_url);
        if (videoId) {
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}`);
          const data = await response.json();
          const videoTitle = data.title || 'Untitled Video';
          const videoThumbnail = data.thumbnail_url || '';
          // Implement video cleanup logic here
        }
      } catch (error) {
        console.error('Error cleaning up video:', error);
      }
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

      {/* Login Form */}
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

      {/* Folder List */}
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

      {/* Videos List */}
      {videos.filter(video => 
        currentFolder 
          ? video.folder === currentFolder?.id 
          : !video.folder
      ).length > 0 && (
        <View style={styles.videosSection}>
          <Text style={styles.sectionTitle}>Videos</Text>
          <FlatList
            data={videos.filter(video => 
              currentFolder 
                ? video.folder === currentFolder?.id 
                : !video.folder
            )}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.videoItem}
                onPress={() => handleVideoPress(item)}
              >
                <View style={styles.videoContent}>
                  <Ionicons name="videocam" size={24} color="#D84315" />
                  <Text style={styles.videoText}>{item.title}</Text>
                </View>
                {token && (
                  <TouchableOpacity onPress={() => handleDeleteVideo(item.id)}>
                    <Text style={styles.deleteText}>❌</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Create Buttons for authenticated users */}
      {token && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowVideoModal(true)}
          >
            <Text style={styles.createButtonText}>Create Video</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowFolderModal(true)}
          >
            <Text style={styles.createButtonText}>Create Folder</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Video Creation Modal */}
      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add YouTube Video</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter video name"
              value={videoName}
              onChangeText={setVideoName}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter YouTube URL"
              value={videoUrl}
              onChangeText={setVideoUrl}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF7F50' }]}
                onPress={handleCreateVideo}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowVideoModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Folder Creation Modal */}
      <Modal
        visible={showFolderModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Folder</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter folder name"
              value={folderName}
              onChangeText={setFolderName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF7F50' }]}
                onPress={handleCreateFolder}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowFolderModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        visible={showVideoPlayer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVideoPlayer(false)}
      >
        <View style={styles.videoPlayerContainer}>
          <View style={styles.videoPlayerContent}>
            <View style={styles.videoPlayerHeader}>
              <Text style={styles.videoPlayerTitle}>
                {selectedVideo?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setShowVideoPlayer(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#D84315" />
              </TouchableOpacity>
            </View>
            {selectedVideo && (
              <View style={styles.videoContainer}>
                <WebView
                  source={{ html: getYouTubeEmbedHtml(selectedVideo.youtube_url) || '' }}
                  style={styles.videoPlayer}
                  allowsFullscreenVideo={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  mediaPlaybackRequiresUserAction={false}
                  allowsInlineMediaPlayback={true}
                  scrollEnabled={false}
                  onShouldStartLoadWithRequest={(request) => {
                    // Block navigation to external URLs
                    return false;
                  }}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error:', nativeEvent);
                    Alert.alert(
                      "Video Error",
                      "Unable to play the video. Please try again later.",
                      [{ text: "OK", onPress: () => setShowVideoPlayer(false) }]
                    );
                  }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: "#FF7F50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#FF4500",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  createButtonText: {
    color: "#FFF5E1",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#D84315',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF5E1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FF8A65',
    backgroundColor: '#FFE0B2',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  videoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#BF360C',
    marginLeft: 10,
  },
  videosSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D84315',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF3E0',
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFE0B2',
    borderBottomWidth: 1,
    borderBottomColor: '#FF8A65',
  },
  videoPlayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D84315',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: '#D84315',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: '#D84315',
    fontSize: 16,
  },
});
