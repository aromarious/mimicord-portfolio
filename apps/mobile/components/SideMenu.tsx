import {
  Bot,
  Code,
  Hash,
  Home,
  LogOut,
  MessageSquare,
  Plus,
} from "lucide-react-native"
import React from "react"
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

type SideMenuProps = {
  user: any
  onLogout: () => void
}

export default function SideMenu({ user, onLogout }: SideMenuProps) {
  const servers = [
    { id: 1, name: "Home", icon: Home, active: true },
    { id: 2, name: "AI Lab", icon: Bot },
    { id: 3, name: "Dev", icon: Code },
    { id: 4, name: "Social", icon: MessageSquare },
  ]

  return (
    <View style={styles.container}>
      {/* Left Rail (Servers) */}
      <View style={styles.serverRail}>
        <SafeAreaView edges={["top"]} style={styles.railContent}>
          {servers.map((server) => (
            <View key={server.id} style={styles.serverItemContainer}>
              {server.active && <View style={styles.activePill} />}
              <TouchableOpacity
                style={[
                  styles.serverIcon,
                  server.active
                    ? styles.serverIconActive
                    : styles.serverIconInactive,
                ]}
              >
                <server.icon
                  size={24}
                  color={server.active ? "#ffffff" : "#dcddde"}
                />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.separator} />
          <TouchableOpacity style={[styles.serverIcon, styles.addServerIcon]}>
            <Plus size={24} color="#3ba55d" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Right Panel (Channels & User) */}
      <SafeAreaView style={styles.channelPanel} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mimicord</Text>
        </View>

        {/* Content (Channels) */}
        <ScrollView style={styles.content}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryText}>TEXT CHANNELS</Text>
          </View>

          <TouchableOpacity style={styles.channelItem}>
            <Hash size={20} color="#8e9297" style={{ marginRight: 6 }} />
            <Text style={styles.channelText}>general-aromarious</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer (User) */}
        <View style={styles.footer}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user?.image || "https://github.com/shadcn.png" }}
                style={styles.avatar}
              />
              <View style={styles.statusBadge} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username} numberOfLines={1}>
                {user?.name || "User"}
              </Text>
              <Text style={styles.userDiscriminator}>
                #{user?.id?.slice(-4) || "0000"}
              </Text>
            </View>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
              <LogOut size={20} color="#ed4245" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#202225", // Match server rail bg to avoid gaps
  },
  // Server Rail
  serverRail: {
    width: 72,
    backgroundColor: "#202225",
    alignItems: "center",
  },
  railContent: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  serverItemContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: 48,
  },
  activePill: {
    position: "absolute",
    left: 0,
    width: 4,
    height: 40,
    backgroundColor: "white",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  serverIconActive: {
    backgroundColor: "#5865f2",
    borderRadius: 16,
  },
  serverIconInactive: {
    backgroundColor: "#36393f",
  },
  addServerIcon: {
    backgroundColor: "#36393f",
    borderRadius: 24,
  },
  separator: {
    width: 32,
    height: 2,
    backgroundColor: "#36393f",
    marginVertical: 4,
  },

  // Right Panel
  channelPanel: {
    flex: 1,
    backgroundColor: "#2f3136",
    borderTopLeftRadius: 8, // Subtle visual separation
  },
  header: {
    height: 48,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#202225",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryText: {
    color: "#8e9297",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 8,
    backgroundColor: "#4f545c", // Active channel style
    borderRadius: 4,
  },
  channelText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    height: 52,
    backgroundColor: "#292b2f",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#36393f",
  },
  statusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3ba55d",
    borderWidth: 2,
    borderColor: "#292b2f",
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  userDiscriminator: {
    color: "#b9bbbe",
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    borderRadius: 4,
  },
})
