import type { LucideIcon } from "lucide-react-native"
import type React from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

interface LoginScreenProps {
  onLogin: () => void
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>We're so excited to see you again!</Text>

      <View style={styles.form}>
        <TouchableOpacity style={styles.googleButton} onPress={onLogin}>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: This will open a web browser to authenticate with your Google
          account.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#36393f",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#b9bbbe",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#b9bbbe",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  googleButton: {
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 16,
  },
  googleButtonText: {
    color: "#202225",
    fontSize: 16,
    fontWeight: "bold",
  },
  note: {
    color: "#72767d",
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
  },
})

export default LoginScreen
