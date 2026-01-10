import * as Linking from "expo-linking"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import {
  type DrawerLayout,
  GestureHandlerRootView,
} from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import ChatScreen from "./components/ChatScreen"
import MainLayout from "./components/MainLayout"
import { authClient, signInWithGoogle, signOut } from "./lib/auth"

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const drawerRef = useRef<DrawerLayout>(null)

  const checkSession = useCallback(async () => {
    setIsLoading(true)
    try {
      // Attempt to get session from the server
      const { data: sessionData } = await authClient.getSession()
      setSession(sessionData)
    } catch (e) {
      console.log("Session check failed", e)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Handle deep linking for auth callback
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const data = Linking.parse(event.url)
      if (
        data.path === "auth/callback" ||
        event.url.includes("auth/callback")
      ) {
        // Reload session after callback
        checkSession()
      }
    }

    const subscription = Linking.addEventListener("url", handleDeepLink)
    return () => {
      subscription.remove()
    }
  }, [checkSession])

  const handleLogin = async () => {
    const result = await signInWithGoogle()
    // BetterAuth returns an object with data or error
    if (result && !result.error) {
      checkSession()
    }
  }

  const handleLogout = async () => {
    await signOut()
    setSession(null)
  }

  const handleOpenDrawer = () => {
    drawerRef.current?.openDrawer()
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#5865f2" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {session ? (
            <MainLayout
              user={session.user}
              onLogout={handleLogout}
              drawerRef={drawerRef}
            >
              <ChatScreen onMenuPress={handleOpenDrawer} />
            </MainLayout>
          ) : (
            <View style={styles.center}>
              <Text style={styles.title}>Mimicord</Text>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleLogin}
              >
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>
          )}
          <StatusBar style="light" />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#36393f",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  googleButtonText: {
    color: "#202225",
    fontSize: 16,
    fontWeight: "bold",
  },
})
