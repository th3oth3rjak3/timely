import { ActionIcon, ActionIconVariant, FloatingPosition, MantineColor, MantineSize } from "@mantine/core";
import { ReactNode } from "react";
import useColorPalette from "../hooks/useColorPalette";
import MyTooltip from "./MyTooltip";

export interface StyledActionIconProps {
  size?: number | MantineSize | (string & {});
  variant?: ActionIconVariant;
  children: ReactNode;
  onClick?: () => void;
  color?: MantineColor;
  tooltipLabel?: string;
  tooltipPosition?: FloatingPosition;
};

function StyledActionIcon({
  children,
  size,
  variant,
  onClick,
  color,
  tooltipLabel,
  tooltipPosition,
}: StyledActionIconProps) {
  const colorPalette = useColorPalette();
  const innerVariant = variant !== undefined ? variant : colorPalette.variant;
  const innerColor = color !== undefined ? color : colorPalette.colorName;
  const icon = (
    <ActionIcon
      size={size}
      variant={innerVariant}
      gradient={colorPalette.gradient}
      color={innerColor}
      onClick={onClick}
    >
      {children}
    </ActionIcon>
  );

  if (tooltipLabel !== undefined) {
    return (
      <MyTooltip
        label={tooltipLabel}
        position={tooltipPosition}
        colorPalette={colorPalette}
      >
        {icon}
      </MyTooltip>
    );
  }

  return icon;
}

export default StyledActionIcon;