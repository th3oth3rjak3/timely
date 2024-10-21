import { FloatingPosition, MantineTransition, Tooltip } from "@mantine/core";
import { ReactNode } from "react";

type MyTooltipProps = {
    label: string;
    children: ReactNode
    position?: FloatingPosition
}

function MyTooltip(props: MyTooltipProps) {

    const position: FloatingPosition = props.position ?? "top";

    const transition = (position: FloatingPosition): MantineTransition => {
        if (position === "left") {
            return "slide-right";
        }

        if (position === "right") {
            return "slide-left";
        }

        if (position === "top") {
            return "slide-down";
        }

        if (position === "bottom") {
            return "slide-up";
        }

        return "fade";
    }

    return (
        <Tooltip
            label={props.label}
            openDelay={500}
            transitionProps={{ transition: transition(position), duration: 300 }}
            color="cyan"
            position={position}
            offset={10}
        >
            {props.children}
        </Tooltip>
    );
}

export default MyTooltip;