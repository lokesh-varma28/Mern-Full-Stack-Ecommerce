import { createContext, useContext, useState, useCallback } from "react";

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
    const [compareProducts, setCompareProducts] = useState([]);
    // toast message for "max 4" warning
    const [compareToast, setCompareToast] = useState("");

    const showToast = (msg) => {
        setCompareToast(msg);
        setTimeout(() => setCompareToast(""), 3000);
    };

    const addToCompare = useCallback((product) => {
        setCompareProducts((prev) => {
            const exists = prev.find((item) => item._id === product._id);
            if (exists) {
                showToast(`"${product.title.slice(0, 30)}…" is already in compare`);
                return prev;
            }
            if (prev.length >= 4) {
                showToast("You can compare up to 4 products at a time");
                return prev;
            }
            return [...prev, product];
        });
    }, []);

    const removeFromCompare = useCallback((id) => {
        setCompareProducts((prev) => prev.filter((item) => item._id !== id));
    }, []);

    const clearCompare = useCallback(() => {
        setCompareProducts([]);
    }, []);

    return (
        <CompareContext.Provider
            value={{
                compareProducts,
                compareToast,
                addToCompare,
                removeFromCompare,
                clearCompare,
            }}
        >
            {children}
        </CompareContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCompare = () => useContext(CompareContext);
