import { Button, ButtonVariant, FloatingPosition, MantineGradient, MantineSize } from "@mantine/core";
import { ReactNode } from "react";
import { ColorPalette } from "../features/settings/hooks/useColorService";
import MyTooltip from "./MyTooltip";

export type StyledButtonProps = {
    type?: "button" | "submit" | "reset";
    size?: "compact-sm" | MantineSize | (string & {}) | "compact-xs" | "compact-md" | "compact-lg" | "compact-xl" | undefined
    label: string;
    colorPalette: ColorPalette;
    color?: string;
    gradient?: MantineGradient;
    disabled?: boolean;
    variant?: string | ButtonVariant;
    onClick?: () => void;
    tooltipLabel?: string;
    tooltipPosition?: FloatingPosition;
    tooltipColor?: string;
    leftSection?: ReactNode;
    rightSection?: ReactNode;

}

function StyledButton(
    {
        type,
        size,
        label,
        colorPalette,
        color,
        gradient,
        disabled,
        onClick,
        tooltipPosition,
        tooltipLabel,
        tooltipColor,
        leftSection,
        rightSection,
        variant,

    }: StyledButtonProps
): JSX.Element {

    const innerGradient = gradient !== undefined
        ? gradient
        : {
            from: colorPalette.gradientFrom,
            to: colorPalette.gradientTo,
            deg: colorPalette.gradientDegrees
        };

    const innerColor = color !== undefined ? color : colorPalette.colorName;
    const innerVariant = variant !== undefined ? variant : colorPalette.variant;

    const button = (
        <Button
            size={size}
            type={type}
            variant={innerVariant}
            color={innerColor}
            gradient={innerGradient}
            disabled={disabled}
            onClick={onClick}
            leftSection={leftSection}
            rightSection={rightSection}
        >
            {label}
        </Button>
    );

    if (tooltipLabel !== undefined) {
        const innerTooltipColor = tooltipColor !== undefined ? tooltipColor : colorPalette.colorName;
        return (
            <MyTooltip label={tooltipLabel} position={tooltipPosition} colorPalette={colorPalette} color={innerTooltipColor}>
                {button}
            </MyTooltip>
        )
    }

    return button;


}

export default StyledButton;