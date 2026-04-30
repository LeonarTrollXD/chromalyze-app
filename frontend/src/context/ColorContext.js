import React, { createContext, useState, useContext } from 'react';

const ColorContext = createContext();

export const ColorProvider = ({ children }) => {
    const initialState = [
        { id: 0, hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', filled: false },
        { id: 1, hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', filled: false },
        { id: 2, hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', filled: false },
        { id: 3, hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', filled: false },
        { id: 4, hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', filled: false },
    ];

    // ESTADO 1: Para la creación manual (Persiste mientras la app esté abierta)
    const [creationPalette, setCreationPalette] = useState(initialState);
    
    // ESTADO 2: Para la edición de paletas guardadas (Se limpia al guardar o cancelar)
    const [editingPalette, setEditingPalette] = useState(initialState);

    // Función auxiliar para calcular RGB
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) || 255;
        const g = parseInt(hex.slice(3, 5), 16) || 255;
        const b = parseInt(hex.slice(5, 7), 16) || 255;
        return `rgb(${r}, ${g}, ${b})`;
    };

    // Actualiza el color dependiendo de en qué modo estés (Crear o Editar)
    const updateColor = (slotId, hex, isEditingMode = false) => {
        if (!hex || !hex.startsWith('#')) return;
        const rgb = hexToRgb(hex);

        if (isEditingMode) {
            setEditingPalette(prev => prev.map(slot => 
                slot.id === slotId ? { ...slot, hex, rgb, filled: true } : slot
            ));
        } else {
            setCreationPalette(prev => prev.map(slot => 
                slot.id === slotId ? { ...slot, hex, rgb, filled: true } : slot
            ));
        }
    };

    const resetColor = (slotId, isEditingMode = false) => {
        if (isEditingMode) {
            setEditingPalette(prev => prev.map(slot => 
                slot.id === slotId ? { ...initialState[slotId] } : slot
            ));
        } else {
            setCreationPalette(prev => prev.map(slot => 
                slot.id === slotId ? { ...initialState[slotId] } : slot
            ));
        }
    };

    const resetPalette = (isEditingMode = false) => {
        if (isEditingMode) {
            setEditingPalette(initialState);
        } else {
            setCreationPalette(initialState);
        }
    };

    return (
        <ColorContext.Provider value={{ 
            palette: creationPalette,        // Por defecto mandamos la de creación
            setPalette: setCreationPalette,
            editingPalette,                  // Estado separado para edición
            setEditingPalette,
            updateColor, 
            resetColor, 
            resetPalette 
        }}>
            {children}
        </ColorContext.Provider>
    );
};

export const useColors = () => useContext(ColorContext);