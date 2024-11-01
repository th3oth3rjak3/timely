import { MantineTheme } from '@mantine/core';
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
}

const useColorService = (theme: MantineTheme, settings: UserSettings) => {

    const withColorVariant = (colorName: string): ColorPalette => {
        if (colorName === undefined) {
            colorName = "cyan";
        }

        const result = theme.variantColorResolver({
            color: colorName,
            theme: theme,
            variant: "light",
            autoContrast: true,
        });

        return {
            colorName,
            variant: "light",
            color: result.color,
            background: result.background,
            hover: result.hover,
            border: result.border,
            hoverColor: result.hoverColor,
        }
    }

    const colorPalette = useMemo(() => {
        return withColorVariant(settings.colorScheme);

    }, [settings]);
    return { colorPalette };
}

export default useColorService;