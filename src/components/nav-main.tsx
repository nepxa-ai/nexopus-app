"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Icon as TablerIcon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Item = {
  title: string;
  url: string;              // ej: "/dashboard" | "/admin" | "#"
  icon?: TablerIcon;        // de @tabler/icons-react
};

export function NavMain({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isLink = item.url && item.url !== "#";
            const isActive =
              isLink &&
              (pathname === item.url || pathname.startsWith(item.url + "/"));

            return (
              <SidebarMenuItem key={item.title}>
                {isLink ? (
                  // Navegación real con Next Link
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    data-active={isActive ? "true" : undefined}
                  >
                    <Link href={item.url}>
                      {Icon && <Icon className="size-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  // Botón inactivo cuando url === "#"
                  <SidebarMenuButton tooltip={item.title} disabled>
                    {Icon && <Icon className="size-4" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
