"use client";

import React from 'react';
import BIDashboardExplorer from './BIDashboardExplorer';

export default function BIDashboard({ 
  selectedTamano, setSelectedTamano, 
  selectedCiiu, setSelectedCiiu, 
  selectedMacroSector, setSelectedMacroSector, 
  selectedAnos, setSelectedAnos 
}: any) {
  return (
    <BIDashboardExplorer 
      selectedTamano={selectedTamano}
      setSelectedTamano={setSelectedTamano}
      selectedCiiu={selectedCiiu}
      setSelectedCiiu={setSelectedCiiu}
      selectedMacroSector={selectedMacroSector}
      setSelectedMacroSector={setSelectedMacroSector}
      selectedAnos={selectedAnos}
      setSelectedAnos={setSelectedAnos}
    />
  );
}