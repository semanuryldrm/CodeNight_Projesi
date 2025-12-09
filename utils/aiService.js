// Basit AI Simülasyonu
exports.suggestCategory = async (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('wifi') || desc.includes('internet')) return { category: 'Wi-Fi/Internet', confidence: 0.9 };
    if (desc.includes('lms') || desc.includes('şifre')) return { category: 'LMS/Hesap', confidence: 0.8 };
    if (desc.includes('lab') || desc.includes('projeksiyon')) return { category: 'Donanım', confidence: 0.85 };
    return { category: 'Genel Destek', confidence: 0.5 };
};

exports.suggestPriority = async (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('acil') || desc.includes('sınav')) return { priority: 'high', confidence: 0.9 };
    return { priority: 'medium', confidence: 0.6 };
};

exports.generateSummary = async (description) => {
    return description.length > 50 ? description.substring(0, 47) + '...' : description;
};

exports.generateResponseDraft = async (description, category) => {
    return Merhaba, ${category} konusundaki probleminizi inceledik. İlgili birim yönlendirildi.;
};
