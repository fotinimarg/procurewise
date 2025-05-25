import { useState } from "react";

const greekNomoi = [
    "Achaea", "Aetolia-Acarnania", "Arcadia", "Argolis", "Arta", "Attica",
    "Boeotia", "Chalkidiki", "Chania", "Chios", "Corfu", "Corinthia",
    "Cyclades", "Dodecanese", "Drama", "Elis", "Euboea",
    "Evros", "Evrytania", "Florina", "Grevena", "Heraklion", "Imathia",
    "Ioannina", "Karditsa", "Kastoria", "Kavala", "Kefalonia", "Kilkis",
    "Kozani", "Laconia", "Larissa", "Lasithi", "Lefkada", "Lesvos", "Magnesia",
    "Messenia", "Pella", "Phocis", "Phthiotis", "Pieria",
    "Preveza", "Rhodope", "Rethymno", "Serres", "Samos", "Thesprotia",
    "Trikala", "Xanthi", "Zakynthos"
];

export default function RegionSelect({ value, onChange }) {
    return (
        <div className="mb-3">
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                Select Region:
            </label>
            <select
                id="region"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 block w-full rounded-xl p-2 focus:border-indigo-500 border"
            >
                <option value="">-- Select --</option>
                {greekNomoi.map((nomos, index) => (
                    <option key={index} value={nomos}>{nomos}</option>
                ))}
            </select>
        </div>
    );
}