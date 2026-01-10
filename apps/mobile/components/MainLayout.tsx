import type React from "react"
import { StyleSheet, View } from "react-native"
import { DrawerLayout } from "react-native-gesture-handler"
import SideMenu from "./SideMenu"

type MainLayoutProps = {
  children: React.ReactNode
  user: any
  onLogout: () => void
  drawerRef: React.RefObject<DrawerLayout | null>
}

export default function MainLayout({
  children,
  user,
  onLogout,
  drawerRef,
}: MainLayoutProps) {
  const renderNavigationView = () => (
    <SideMenu user={user} onLogout={onLogout} />
  )

  return (
    <DrawerLayout
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      drawerType="front"
      drawerBackgroundColor="#2f3136"
      renderNavigationView={renderNavigationView}
    >
      <View style={styles.container}>{children}</View>
    </DrawerLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#36393f",
  },
})
