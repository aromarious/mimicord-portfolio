import { LinearGradient } from "expo-linear-gradient"
import { Bell, Hash, Menu, Send } from "lucide-react-native"
import React, { useEffect, useRef } from "react"
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NEXT_COMMAND } from "../constants"
import { useChat } from "../hooks/useChat"
import MessageItem from "./MessageItem"

type ChatScreenProps = {
  onMenuPress?: () => void
}

const ChatScreen = ({ onMenuPress }: ChatScreenProps) => {
  const insets = useSafeAreaInsets()
  const { messages, isProcessing, handleNext } = useChat()
  const listRef = useRef<FlatList>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#36393f" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: 50 + insets.top },
        ]}
      >
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Menu color="#8e9297" size={24} />
        </TouchableOpacity>
        <View style={styles.channelInfo}>
          <Hash color="#8e9297" size={24} />
          <Text style={styles.channelName}>general-aromarious</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Bell color="#b9bbbe" size={24} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageItem message={item} />}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />

      {/* Interaction Area */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              isProcessing && styles.nextButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleNext}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <NEXT_COMMAND.icon
                color="#ffffff"
                size={24}
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.nextButtonText}>
              {isProcessing ? "Channelling..." : NEXT_COMMAND.label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#36393f",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#202225",
    backgroundColor: "#36393f",
    elevation: 2,
    zIndex: 10,
  },
  menuButton: {
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  channelName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bellButton: {
    padding: 4,
  },
  list: {
    flex: 1,
    backgroundColor: "#36393f",
  },
  listContent: {
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20, // Add explicit padding for safety if SafeAreaView bottom is not enough or overlaps
    paddingTop: 16,
    backgroundColor: "#36393f",
  },
  footerContent: {
    maxWidth: 600, // Limit width on tablets
    width: "100%",
    alignSelf: "center",
  },
  nextButton: {
    backgroundColor: "#5865f2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900", // black
  },
  nextButtonDisabled: {
    backgroundColor: "#4f545c",
    opacity: 0.8,
  },
})

export default ChatScreen
