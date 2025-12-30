import { Product, Supermarket, MainBanner, GridBanner } from '../types';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRU-bOKDig64F2nxlQDfkkcGSk9lRfxJsE31SeGbHa0q8qHW1WQO963zpfbbFaBhkuGScJsEuvIoZ8D/pubhtml';

async function fetchSheetData(gid: string): Promise<string[][]> {
  try {
    const response = await fetch(`${BASE_URL}?gid=${gid}&single=true&widget=false&headers=false`);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const rows = Array.from(doc.querySelectorAll('table.waffle tr, tr'));
    
    return rows.map(row => 
      Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim())
    ).filter(row => {
      const hasContent = row.some(cell => cell !== '');
      if (!hasContent) return false;

      const firstCell = row[0]?.toLowerCase() || '';
      const secondCell = row[1]?.toLowerCase() || '';
      
      const isHeader = 
        firstCell === 'id' || 
        secondCell === 'produto' || 
        secondCell === 'nome' || 
        secondCell === 'título' ||
        secondCell === 'titulo' ||
        firstCell === 'sugestões de busca';

      return !isHeader && row[0] !== '' && row[0] !== 'ID';
    });
  } catch (error) {
    console.error(`Error fetching sheet ${gid}:`, error);
    return [];
  }
}

export const getProducts = async (): Promise<Product[]> => {
  const data = await fetchSheetData('919625005');
  return data.map(row => {
    const promoVal = row[5]?.toLowerCase();
    const isPromo = ['true', '1', 'sim', 'verdadeiro', 'yes'].includes(promoVal);
    const promoPrice = parseFloat(row[6]?.replace(',', '.')) || 0;
    const normalPrice = parseFloat(row[4]?.replace(',', '.')) || 0;

    // Galeria de imagens (row[2], row[9], row[10])
    const images = [row[2], row[9], row[10]].filter(url => url && url.startsWith('http'));

    return {
      id: row[0],
      name: row[1],
      imageUrl: row[2],
      images: images.length > 0 ? images : [row[2]],
      category: row[3],
      normalPrice: normalPrice,
      isPromo: isPromo && promoPrice > 0,
      promoPrice: promoPrice,
      supermarket: row[7],
      lastUpdate: row[8],
      brand: row[11] || '',
      description: row[12] || ''
    };
  });
};

export const getSupermarkets = async (): Promise<Supermarket[]> => {
  const data = await fetchSheetData('1727956926');
  return data.map(row => ({
    id: row[0],
    name: row[1],
    logo: row[2],
    street: row[3],
    number: row[4],
    neighborhood: row[5],
    flyerUrl: row[6],
    priceIndex: parseFloat(row[7]?.replace(',', '.')) || 1.0,
    status: row[8] || 'Fechado'
  }));
};

export const getMainBanners = async (): Promise<MainBanner[]> => {
  const data = await fetchSheetData('336297383');
  return data.map(row => ({
    id: row[0],
    title: row[1],
    description: row[2],
    buttonText: row[3],
    link: row[4],
    imageUrl: row[5]
  })).sort(() => Math.random() - 0.5);
};

export const getGridBanners = async (): Promise<GridBanner[]> => {
  const data = await fetchSheetData('95797175');
  return data.map(row => ({
    id: row[0],
    title: row[1],
    subtitle: row[2],
    cta: row[3],
    tag: row[4],
    imageUrl: row[5]
  })).sort(() => Math.random() - 0.5);
};

export const getPopularSuggestions = async (): Promise<string[]> => {
  const data = await fetchSheetData('261612517');
  // Mapeia apenas a primeira coluna que contém os termos de busca
  return data.map(row => row[0]).filter(term => term && term.length > 0);
};