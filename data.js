export const LOGOS=[1,2,3];
export const PALETTES={
gold:{name:'Black and gold',primary:'#1E1F1F',secondary:'#B08A56',accent:'#8F7B69',neutral1:'#E6E4E0',neutral2:'#FAFAF8'},
blue:{name:'Blue',primary:'#1B2E46',secondary:'#B78352',accent:'#244A78',neutral1:'#E6E4E0',neutral2:'#FAFAF8'},
green:{name:'Green',primary:'#143629',secondary:'#A67C52',accent:'#1F4D3A',neutral1:'#E6E4E0',neutral2:'#FAFAF8'}};
export const APPLICATIONS={sign:'Limestone wall signage',card:'Business card',polo:'Polo shirt',cap:'Baseball cap'};
export const VARIATIONS={stacked:'Primary stacked',horizontal:'Horizontal',favDark:'Dark favicon',favLight:'Light favicon',symbol:'Standalone symbol'};
export const logoAsset=(logo,palette,variation='stacked')=>`assets/logos/${palette||'black'}/${logo}/${variation}.svg`;
export const mockupAsset=(logo,palette,application)=>`assets/mockups/${palette}/${logo}/${application}.png`;
export const blankAsset=application=>`assets/mockups/blank/${application}.png`;
// The supplied black artboards omit complete standalone symbols.
export const availableVariations=palette=>Object.keys(VARIATIONS).filter(key=>palette||key!=='symbol');
