import { ActionIcon, ActionIconVariant, FloatingPosition, MantineColor, MantineSize } from "@mantine/core";
import { ReactNode } from "react";
import { ColorPalette } from "../features/settings/hooks/useColorService";
import MyTooltip from "./MyTooltip";

export type StyledActionIconProps = {
    size?: number | MantineSize | (string & {});
    variant?: ActionIconVariant;
    colorPalette: ColorPalette;
    children: ReactNode;
    onClick?: () => void;
    color?: MantineColor;
    tooltipLabel?: string;
    tooltipPosition?: FloatingPosition
};


function StyledActionIcon({
    children,
    size,
    variant,
    colorPalette,
    onClick,
    color,
    tooltipLabel,
    tooltipPosition,
}: StyledActionIconProps) {

    const innerVariant = variant !== undefined ? variant : colorPalette.variant;
    const innerColor = color !== undefined ? color : colorPalette.colorName;
    const icon = (
        <ActionIcon
            size={size}
            variant={innerVariant}
            gradient={colorPalette.gradient}
            color={innerColor}
            onClick={onClick}>
            {children}
        </ActionIcon>
    );

    if (tooltipLabel !== undefined) {
        return (
            <MyTooltip label={tooltipLabel} position={tooltipPosition} colorPalette={colorPalette}>
                {icon}
            </MyTooltip>
        );
    }

    return icon;
}

export default StyledActionIcon;