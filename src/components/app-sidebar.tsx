"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


import { fetchMe } from "@/lib/api"
type NavUserShape = { name: string; email: string; avatar: string }

const data = {
  //user: {
  //  name: "Usuario",
  //  email: "usuario@correo.com",
  //  avatar: "/avatars/shadcn.jpg",
  //},
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Automatización AI",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Analítica",
      url: "#",
      icon: IconChartBar,
    },
    /*
    {
      title: "Projects",
      url: "#",
      icon: IconFolder,
    }, */
    {
      title: "Equipo Gestores",
      url: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Database ",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reportes",
      url: "#",
      icon: IconReport,
    }
    /*,
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },*/
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const [navUser, setNavUser] = React.useState<NavUserShape | null>(null)

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    if (!token) return
    fetchMe(token)
      .then((u) => {
        // tu /auth/me devuelve: { id, email, nombres, apellidos, rol, ... }
        const name = [u.nombres, u.apellidos].filter(Boolean).join(" ") || "Usuario"
        setNavUser({
          name,
          email: u.email,
          avatar: "/avatars/shadcn.jpg", // o u.avatar si lo tienes
        })
      })
      .catch(() => {
        setNavUser({
          name: "Usuario",
          email: "usuario@correo.com",
          avatar: "/avatars/shadcn.jpg",
        })
      })
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Open Group</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {navUser && <NavUser user={navUser} />}
        {!navUser && (
          // estado loading/fallback opcional
          <div className="px-3 py-2 text-xs text-muted-foreground">cargando usuario…</div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
