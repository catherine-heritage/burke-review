export const LOGOS=[1,2,3];
export const PALETTES={gold:{name:'Gold 06',primary:'#1E1F1F',secondary:'#B08A56'},blue:{name:'Blue 03',primary:'#1B2E46',secondary:'#B78352'},green:{name:'Green 04',primary:'#143629',secondary:'#A67C52'}};
export const APPLICATIONS={sign:'Limestone wall signage',card:'Business card',polo:'Polo shirt',cap:'Baseball cap'};
export const VARIATIONS={stacked:'Primary stacked',horizontal:'Horizontal',favDark:'Dark favicon',favLight:'Light favicon',symbol:'Standalone symbol'};
export const logoAsset=(logo,palette,variation='stacked')=>`assets/logos/${palette||'black'}/${logo}/${variation}.svg`;
export const mockupAsset=(logo,palette,application)=>`assets/mockups/${palette}/${logo}/${application}.png`;
export const blankAsset=application=>`assets/mockups/blank/${application}.png`;
// The supplied black artboards omit complete standalone symbols.
export const availableVariations=palette=>Object.keys(VARIATIONS).filter(key=>palette||key!=='symbol');
