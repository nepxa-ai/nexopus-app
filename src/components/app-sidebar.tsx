"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconInnerShadowTop,
  IconDashboard,
  IconUsers,
  IconLibrary,
  IconBrain,
  IconAutomaticGearbox,
  IconProgress,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"

import { fetchMe } from "@/lib/api-auth"

type NavUserShape = { name: string; email: string; avatar: string }

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [navUser, setNavUser] = React.useState<NavUserShape | null>(null)
  const [role, setRole] = React.useState<string | null>(null)

  React.useEffect(() => {

    fetchMe()
      .then((u) => {
        const name = [u.nombres, u.apellidos].filter(Boolean).join(" ") || "Usuario"
        setNavUser({ name, email: u.email, avatar: "/avatars/shadcn.jpg" })
        setRole(u.rol ?? null) // <- importante
      })
      .catch(() => {
        setNavUser({ name: "Usuario", email: "usuario@correo.com", avatar: "/avatars/shadcn.jpg" })
        setRole(null)
      })
  }, [])

  // Menú principal — ¡Dashboard ahora va a /dashboard!
  const navMain = [
    { title: "Dashboard",         url: "/dashboard", icon: IconDashboard },
  ]

  //const documents = [
  //  { name: "Database", url: "#", icon: IconDatabase },
  //  { name: "Reportes", url: "#", icon: IconReport },
  //]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              {/* Si también quieres que el logo vaya al dashboard, deja /dashboard aquí */}
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Open Group</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Menú principal */}
        <NavMain items={navMain} />

        {/* Bloque visible sólo para admins */}
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Adminstración</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin">
                    <IconUsers className="size-4" />
                    <span>Administrar usuarios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/catalog">
                    <IconLibrary className="size-4" />
                    <span>Administrar catalogo (Servicios, Categoria, Subcategoria)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/jobs">
                    <IconProgress className="size-4" />
                    <span>Jobs nexopus(Ejecuciones)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* <NavDocuments items={documents} /> */}
      </SidebarContent>

      <SidebarFooter>
        {navUser ? (
          <NavUser user={navUser} />
        ) : (
          <div className="px-3 py-2 text-xs text-muted-foreground">cargando usuario…</div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
