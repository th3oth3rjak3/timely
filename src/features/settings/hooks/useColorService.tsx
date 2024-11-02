import { MantineGradient, MantineTheme } from '@mantine/core';
import { useMemo } from 'react';
import { UserSettings } from '../UserSettings';

export type ColorPalette = {
    colorName: string;
    variant: string;
    color: string;
    background: string;
    hover: string;
    border: string;
    hoverColor?: string;
    gradient: MantineGradient;
}

const useColorService = (theme: MantineTheme, settings: UserSettings) => {

    const withColorVariant = (userSettings: UserSettings): ColorPalette => {
        if (userSettings.colorScheme === undefined) {
            userSettings.colorScheme = "cyan";
        }

        const result = theme.variantColorResolver({
            color: userSettings.colorScheme,
            theme: theme,
            variant: settings.buttonVariant,
            autoContrast: true,
        });

        const getGradientFrom = (gradientFrom: string, theme: MantineTheme) => {
            if (gradientFrom === null || gradientFrom === undefined || gradientFrom.trim() === "") {
                return theme.defaultGradient.from;
            }

            return gradientFrom;
        }

        const getGradientTo = (gradientTo: string, theme: MantineTheme) => {
            if (gradientTo === null || gradientTo === undefined || gradientTo.trim() === "") {
                return theme.defaultGradient.to;
            }

            return gradientTo;
        }

        return {
            colorName: userSettings.colorScheme,
            variant: userSettings.buttonVariant,
            color: result.color,
            background: result.background,
            hover: result.hover,
            border: result.border,
            hoverColor: result.hoverColor,
            gradient: {
                to: getGradientTo(userSettings.gradientTo, theme),
                from: getGradientFrom(userSettings.gradientFrom, theme),
                deg: userSettings.gradientDegrees
            }
        }
    }

    const colorPalette = useMemo(() => {
        return withColorVariant(settings);

    }, [settings]);
    return { colorPalette };
}

export default useColorService;