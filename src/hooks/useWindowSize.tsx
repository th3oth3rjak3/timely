import { useEffect, useState } from "react";

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    return windowSize;
}

export default useWindowSize;