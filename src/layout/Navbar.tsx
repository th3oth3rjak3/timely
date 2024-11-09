import { Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Icon, IconAlarm, IconListDetails, IconSettings, IconTags } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import StyledButton from "../components/StyledButton";
import { ColorPalette } from "../features/settings/hooks/useColorService";

type LinkDetail = {
    href: string;
    icon: Icon;
    label: string;
    description?: string;
}

const navLinks: LinkDetail[] = [
    { href: "/timer", icon: IconAlarm, label: "Timer", description: "Timer Page" },
    { href: "/tasks", icon: IconListDetails, label: "Tasks", description: "Tasks Page" },
    { href: "/tags", icon: IconTags, label: "Tags", description: "Tags Page" },
    { href: "/settings", icon: IconSettings, label: "Settings", description: "Settings Page" },
];

type Props = {
    colorPalette: ColorPalette;
    closeNavMenu: () => void;
};

function Navbar(props: Props) {
    const isSmallBreakpoint = useMediaQuery('(max-width: 48em)')
    const navigate = useNavigate();
    const location = useLocation();

    const getColor = (item: LinkDetail) => {
      if (item.href !== location.pathname) {
        return "dimmed";
      }
    };

    const getVariant = (item: LinkDetail) => {
      if (item.href !== location.pathname) {
        return "default";
      }
    };

    const navLinkElements = navLinks.map((item) => (
      <StyledButton
        key={item.label}
        colorPalette={props.colorPalette}
        color={getColor(item)}
        variant={getVariant(item)}
        label={item.label}
        onClick={() => {
          navigate(item.href);
          if (isSmallBreakpoint) {
            props.closeNavMenu();
          }
        }}
        leftSection={<item.icon size="1rem" stroke={1.5} />}
        tooltipLabel={item.description}
        tooltipPosition="right"
      />
    ));

    return (
        <Stack gap="sm">
            {navLinkElements}
        </Stack>
    );
}

export default Navbar;