import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error reading localStorage", e);
        }
        return initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}
