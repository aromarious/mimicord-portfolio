import type React from "react"
import { Image, StyleSheet, Text, View } from "react-native"
import type { Message } from "../types"

interface MessageItemProps {
  message: Message
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: message.avatar }} style={styles.avatar} />
      <View style={styles.contentColumn}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.author,
              message.isBot ? styles.authorBot : styles.authorUser,
            ]}
          >
            {message.author}
          </Text>
          {message.isBot && (
            <View style={styles.botTag}>
              <Text style={styles.botTagText}>BOT</Text>
            </View>
          )}
          <Text style={styles.timestamp}>{message.timestamp}</Text>
        </View>
        <View style={styles.messageContent}>
          {message.isLoading ? (
            <View style={styles.loadingContainer}>
              <View
                style={[styles.loadingDot, { backgroundColor: "#dcddde" }]}
              />
              <View
                style={[
                  styles.loadingDot,
                  { backgroundColor: "#dcddde", opacity: 0.7 },
                ]}
              />
              <View
                style={[
                  styles.loadingDot,
                  { backgroundColor: "#dcddde", opacity: 0.4 },
                ]}
              />
            </View>
          ) : (
            <Text style={styles.messageText}>{message.content}</Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    // hover effect cannot be easily replicated without Pressable, skipping for items
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 4,
    marginRight: 16,
  },
  contentColumn: {
    flex: 1,
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center", // baseline is tricky in RN views
    marginBottom: 4,
  },
  author: {
    fontWeight: "500",
    fontSize: 16,
    marginRight: 8,
  },
  authorBot: {
    color: "#00aff4",
  },
  authorUser: {
    color: "#ffffff",
  },
  botTag: {
    backgroundColor: "#5865f2",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  botTagText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    // textTransform: "uppercase", // RN Text supports this
  },
  timestamp: {
    color: "#a3a6aa",
    fontSize: 12,
  },
  messageContent: {
    // text area
  },
  messageText: {
    color: "#dcddde",
    lineHeight: 20,
    fontSize: 15, // default is 14
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})

export default MessageItem
