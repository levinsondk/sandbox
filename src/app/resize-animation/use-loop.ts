import { useInView } from "motion/react";
import React from "react";

const modules = [
    "Motion choreography",
    "Line Graph",
    "Responsive interfaces",
    "Preface",
];

export function useLoop(): [string, React.RefObject<HTMLDivElement | null>] {
    const [active, setActive] = React.useState(modules[0]);
    const ref = React.useRef<HTMLDivElement | null>(null);
    const isInView = useInView(ref);

    React.useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setActive((currentActive) => {
                const index = modules.indexOf(currentActive);
                const nextIndex = (index + 1) % modules.length;
                return modules[nextIndex];
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [isInView, modules]);

    return [active, ref];
}
