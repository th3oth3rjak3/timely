import { NavLink } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Icon, IconAlarm, IconListDetails, IconSettings, IconTags } from "@tabler/icons-react";
import { NavLink as RouterDomNavLink } from "react-router-dom";

type LinkDetail = {
    href: string;
    icon: Icon;
    label: string;
    description?: string;
}

const navLinks: LinkDetail[] = [
    { href: "/timer", icon: IconAlarm, label: "Timer" },
    { href: "/tasks", icon: IconListDetails, label: "Tasks" },
    { href: "/tags", icon: IconTags, label: "Tags" },
    { href: "/settings", icon: IconSettings, label: "Settings" },
];

type Props = {
    closeNavMenu: () => void;
};

function Navbar(props: Props) {
    const isSmallBreakpoint = useMediaQuery('(max-width: 48em)')

    const navLinkElements = navLinks.map((item) => (
        <NavLink
            component={RouterDomNavLink}
            to={item.href}
            key={item.label}
            label={item.label}
            description={item.description}
            leftSection={<item.icon size="1rem" stroke={1.5} />}
            onClick={() => {
                if (isSmallBreakpoint) {
                    props.closeNavMenu();
                }
            }}
            style={{ borderRadius: 4 }}
        />
    ));

    return (
        <>
            {navLinkElements}
        </>
    );
}

export default Navbar;