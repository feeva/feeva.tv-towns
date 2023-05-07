<template>
  <div ref="map" id="map"></div>
</template>

<script>
import 'leaflet';
import 'leaflet.markercluster';

import mastersData from './data/masters.json';
import mealsData from './data/meals.json';
import { formatDate } from './utils';

let currLocation;

export default {
  created() {
    window.navigator.geolocation.getCurrentPosition(pos => {
      currLocation = [pos.coords.latitude, pos.coords.longitude];
      if (this.map) {
        this.map.setView(currLocation, 15);
      }
    });
  },

  mounted() {
    const TILE_URLS = {
      BASE: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
    };
    const VWORLD_ATTRIBUTION = '&copy; <a href="http://www.vworld.kr/po_main.do" target="_blank">공간정보 오픈플랫폼</a>'
      + ' | <a href="http://www.molit.go.kr/" target="_blank">국토교통부</a>';
    const L = window.L;

    this.map = L.map('map', {
      maxZoom: 18,
      minZoom: 7,
      maxBounds: [[31, 122], [40, 134]],
      maxBoundsViscosity: .8,
      zoomControl: false,
      zoomSnap: 1
    });
    L.tileLayer(TILE_URLS.BASE, {
      attribution: VWORLD_ATTRIBUTION,
    }).addTo(this.map);

    if (currLocation) {
      this.map.setView(currLocation, 15);
    } else {
      this.map.fitBounds([[32.5, 125], [39, 130.5]]);
    }

    const markers = L.markerClusterGroup({
      maxClusterRadius: 40,
    });

    const datasetName = ['생활의 달인', '백반기행'];
    const datasetIcons = [
      { html: '달인', iconSize: [36, 20], popupAnchor: [0, -10] },
      { html: '백반', iconSize: [36, 20], popupAnchor: [0, -10] },
    ]
    const datasets = [mastersData, mealsData];

    const popup = L.popup({
      maxWidth: 310,
    }).setContent(marker => {
      const { dataset, item, address } = marker.__data;
      const body = item.body
        .replace(/\n/g, '<br>')
        .replace(address, `<span class="highlight">${address}</span>`);

      return `
        <div><h3 class="h5">${datasetName[dataset]} ${formatDate(item.date)}</h3></div>
        <div class="popup__body">${body}</div>
      `
    });

    function scrollToHighlight() {
      const el = document.querySelector('.highlight');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const now = Date.now()

    datasets.forEach((dataset, idx) => {
      Object.values(dataset).forEach(item => {
        const yearDiff = (now - new Date(item.date.slice(0, 10))) / 1000 / 60 / 60 / 24 / 365;

        item.locations.forEach(loc => {
          const marker = L.marker([loc.lat, loc.lng], {
            icon: L.divIcon({ ...datasetIcons[idx], className: `badge badge-${idx} year-${yearDiff}`}),
            title: loc.address,
            opacity: 5 / (yearDiff + 5),
          });
          marker.__data = { dataset: idx, item, address: loc.address };
          marker.bindPopup(popup).on('popupopen', scrollToHighlight)
          markers.addLayer(marker);
        });
      })
      this.map.addLayer(markers);
    });
  },
}
</script>

<style>
#map {
  width: 100vw; height: 100vh;
}

.leaflet-popup-content {
    margin: 13px 20px;
}

.popup__body {
  max-height: 200px; overflow-y: auto;
}
.highlight {
  background-color: #ff0;
}

.leaflet-marker-icon.badge { padding: 0.35em; font-size: 12px; font-weight: normal; }
.leaflet-marker-icon.badge-0 { background-color: #0086cd; }
.leaflet-marker-icon.badge-1 { background-color: #f54643; }

.leaflet-marker-icon.filter-9 { filter: grayscale(5%); }
.leaflet-marker-icon.filter-8 { filter: grayscale(10%); }
.leaflet-marker-icon.filter-7 { filter: grayscale(15%); }
.leaflet-marker-icon.filter-6 { filter: grayscale(20%); }
.leaflet-marker-icon.filter-5 { filter: grayscale(25%); }
.leaflet-marker-icon.filter-4 { filter: grayscale(30%); }
.leaflet-marker-icon.filter-3 { filter: grayscale(40%); }
</style>
