import type { Ref } from 'vue';
import L from 'leaflet';
import { syncGeoJsonMapLayers } from '@/composables/useGeoJsonMapLayers';
import {
  VOLCANO_CLASSIFICATION_LABELS,
  VOLCANO_LAYERS_INDEX_URL,
} from '@/constants/volcanoLayers';
import { createVolcanoMarkerIcon } from '@/utils/createVolcanoMarkerIcon';
import type { VolcanoClassification } from '@/types/geoLayers';

function getVolcanoClassification(feature: GeoJSON.Feature): VolcanoClassification {
  const value = feature.properties?.classification;
  if (value === 'active' || value === 'potentially_active' || value === 'dormant') {
    return value;
  }
  return 'dormant';
}

function createVolcanoPopup(feature: GeoJSON.Feature): string {
  const props = feature.properties ?? {};
  const classification = getVolcanoClassification(feature);
  const label = VOLCANO_CLASSIFICATION_LABELS[classification];
  const elevation = props.elevation ? `${props.elevation} m` : 'Unknown elevation';
  const location = props.province || props.country || props.region || 'Unknown location';
  return `
    <div class="earthquake-popup">
      <p class="earthquake-popup-place">${props.name ?? 'Volcano'}</p>
      <dl class="earthquake-popup-grid">
        <dt>Status</dt><dd>${label}</dd>
        <dt>Elevation</dt><dd>${elevation}</dd>
        <dt>Location</dt><dd>${location}</dd>
      </dl>
    </div>
  `;
}

export async function syncVolcanoLayers(
  map: L.Map | null,
  activeLayers: Map<string, L.GeoJSON>,
  enabledLayerIds: Ref<string[]>,
  loadingLayerIds: Ref<string[]>
): Promise<void> {
  await syncGeoJsonMapLayers(
    map,
    activeLayers,
    enabledLayerIds,
    loadingLayerIds,
    VOLCANO_LAYERS_INDEX_URL,
    {
      pointToLayer: (feature, latlng) => {
        const classification = getVolcanoClassification(feature);
        return L.marker(latlng, { icon: createVolcanoMarkerIcon(classification) });
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createVolcanoPopup(feature), {
          maxWidth: 260,
          className: 'earthquake-popup-wrapper',
        });
      },
    }
  );
}
