"use client";

import { CheckCircle, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SERVICE_TYPE_ICONS } from "@/components/features/ServiceTypeBadge";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { ServiceType } from "@/lib/schemas/quote";
import { cn } from "@/lib/utils";

interface ServiceTypeTabBarProps {
  activeTab: ServiceType;
  enabledTypes: ServiceType[];
  onTabSwitch: (type: ServiceType) => void;
  onAddType: (type: ServiceType) => void;
  tabValidation: Record<ServiceType, boolean>;
}

const ALL_SERVICE_TYPES: ServiceType[] = ["screen-print", "dtf", "embroidery"];
const EmbroideryIcon = SERVICE_TYPE_ICONS["embroidery"];

export function ServiceTypeTabBar({
  activeTab,
  enabledTypes,
  onTabSwitch,
  onAddType,
  tabValidation,
}: ServiceTypeTabBarProps) {
  const availableToAdd = ALL_SERVICE_TYPES.filter(
    (type) => !enabledTypes.includes(type) && type !== "embroidery"
  );

  return (
    <div role="tablist" className="flex items-center gap-1 border-b border-border bg-elevated rounded-t-lg px-2">
      {enabledTypes.map((type) => {
        const Icon = SERVICE_TYPE_ICONS[type];
        const isActive = activeTab === type;
        const isValid = tabValidation[type];

        return (
          <button
            key={type}
            type="button"
            onClick={() => onTabSwitch(type)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-t-md",
              isActive
                ? "text-action"
                : "text-muted-foreground"
            )}
            aria-selected={isActive}
            aria-controls={`tabpanel-${type}`}
            role="tab"
          >
            <Icon className="size-4" />
            <span>{SERVICE_TYPE_LABELS[type]}</span>
            {isValid && (
              <CheckCircle className="size-3.5 text-success" />
            )}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-action rounded-full" />
            )}
          </button>
        );
      })}

      {/* Embroidery — always disabled with tooltip */}
      {!enabledTypes.includes("embroidery") && (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground/40 cursor-not-allowed"
              role="tab"
              aria-selected={false}
              tabIndex={-1}
            >
              <EmbroideryIcon className="size-4" />
              <span>Embroidery</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      )}

      {/* Add Service Type dropdown */}
      {availableToAdd.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Add Type
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableToAdd.map((type) => {
              const TypeIcon = SERVICE_TYPE_ICONS[type];
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => onAddType(type)}
                >
                  <TypeIcon className="size-4 mr-2" />
                  {SERVICE_TYPE_LABELS[type]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
